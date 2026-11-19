import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../src/firebase/firebase.service';

const EXPECTED_PROJECT = 'rentitease-staging';
const EXPECTED_BUCKET = 'rentitease-staging.firebasestorage.app';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectAnonymousAccessDenied(objectKey: string, label: string) {
  const encodedObjectPath = objectKey.split('/').map(encodeURIComponent).join('/');
  const unsignedUrl = `https://storage.googleapis.com/${EXPECTED_BUCKET}/${encodedObjectPath}`;
  const response = await fetch(unsignedUrl);
  assert(
    response.status === 401 || response.status === 403,
    `${label} was unexpectedly readable without a signed URL (HTTP ${response.status}).`,
  );
  console.log(`PASS: ${label} is not anonymously readable without a signed URL.`);
}

async function main() {
  assert(process.env.FIREBASE_PROJECT_ID === EXPECTED_PROJECT,
    'Refusing to run against a Firebase project other than RentItEase staging.');
  assert(process.env.FIREBASE_STORAGE_BUCKET === EXPECTED_BUCKET,
    'Refusing to run against a bucket other than the RentItEase staging bucket.');
  assert(process.env.GOOGLE_APPLICATION_CREDENTIALS,
    'WIF credentials file is required; refusing implicit local credentials.');

  const firebase = new FirebaseService(new ConfigService());
  const bucket = firebase.getStorage().bucket();
  assert(bucket.name === EXPECTED_BUCKET,
    'Firebase Admin resolved an unexpected Storage bucket.');

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=',
    'base64',
  );
  const pdf = Buffer.from('%PDF-1.4\nRentItEase staging private attachment acceptance test\n%%EOF');
  const imageFile = {
    buffer: png,
    mimetype: 'image/png',
    originalname: 'staging-storage-acceptance.png',
    size: png.length,
  } as Parameters<FirebaseService['uploadImage']>[0];
  const privateFile = {
    buffer: pdf,
    mimetype: 'application/pdf',
    originalname: 'staging-private-acceptance.pdf',
    size: pdf.length,
  } as Parameters<FirebaseService['uploadPrivateFile']>[0];

  let imagePublicId: string | undefined;
  let privatePublicId: string | undefined;

  try {
    const image = await firebase.uploadImage(imageFile, 'properties');
    imagePublicId = image.publicId;
    assert(imagePublicId.startsWith('properties/'),
      'Property image was not stored in the properties folder.');
    assert(image.imageUrl.startsWith('https://storage.googleapis.com/'),
      'Property media URL is not a GCS signed URL.');
    const imageResponse = await fetch(image.imageUrl);
    assert(imageResponse.ok, `Property image signed URL returned HTTP ${imageResponse.status}.`);
    const downloadedImage = Buffer.from(await imageResponse.arrayBuffer());
    assert(downloadedImage.equals(png), 'Downloaded property image bytes do not match the upload.');
    console.log('PASS: property image signed URL returned the original bytes.');
    await expectAnonymousAccessDenied(imagePublicId, 'Property image');

    const privateUpload = await firebase.uploadPrivateFile(
      privateFile,
      'chat/staging-storage-acceptance',
    );
    privatePublicId = privateUpload.publicId;
    assert(privatePublicId.startsWith('chat/staging-storage-acceptance/'),
      'Private attachment was stored outside the isolated acceptance prefix.');

    const signedUrl = await firebase.getPrivateDownloadUrl(privatePublicId);
    const privateResponse = await fetch(signedUrl);
    assert(privateResponse.ok,
      `Private attachment signed URL returned HTTP ${privateResponse.status}.`);
    const downloadedPdf = Buffer.from(await privateResponse.arrayBuffer());
    assert(downloadedPdf.equals(pdf), 'Downloaded private attachment bytes do not match the upload.');
    console.log('PASS: private chat signed URL returned the original bytes.');
    await expectAnonymousAccessDenied(privatePublicId, 'Private chat attachment');
  } finally {
    const cleanup = await Promise.allSettled([
      ...(imagePublicId ? [firebase.deleteImage(imagePublicId)] : []),
      ...(privatePublicId
        ? [bucket.file(privatePublicId).delete({ ignoreNotFound: true })]
        : []),
    ]);
    const failures = cleanup.filter((result) => result.status === 'rejected');
    if (failures.length) {
      console.error('One or more staging acceptance objects could not be cleaned up:', failures);
      throw new Error('Staging Firebase Storage cleanup failed.');
    }
  }

  console.log('PASS: private-media Storage acceptance checks completed; test objects cleaned up.');
}

main().catch((error) => {
  console.error('Firebase Storage staging acceptance failed:', error);
  process.exitCode = 1;
});
