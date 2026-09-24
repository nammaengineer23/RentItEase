import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const panel = {
  position: 'absolute',
  left: 56,
  right: 56,
  padding: '28px 34px',
  borderRadius: 28,
  background: 'rgba(0,0,0,0.62)',
  color: 'white',
  fontFamily: 'Arial, sans-serif',
};

const Photo = ({src}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#111'}}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.62))'}} />
    </AbsoluteFill>
  );
};

export const PropertyReel = (props) => {
  const images = (props.imageUrls || []).filter(Boolean).slice(0, 8);
  const framesPerImage = Math.max(90, Math.floor(720 / Math.max(images.length, 1)));
  return (
    <AbsoluteFill style={{background: '#111'}}>
      {images.map((src, index) => (
        <Sequence key={src + index} from={index * framesPerImage} durationInFrames={framesPerImage}>
          <Photo src={src} />
        </Sequence>
      ))}
      <div style={{...panel, top: 90}}>
        <div style={{fontSize: 58, fontWeight: 800, lineHeight: 1.08}}>{props.title}</div>
        {props.location ? <div style={{fontSize: 32, marginTop: 14}}>{props.location}</div> : null}
      </div>
      <div style={{...panel, bottom: 230}}>
        {props.price ? <div style={{fontSize: 54, fontWeight: 800}}>₹{props.price}/month</div> : null}
        <div style={{fontSize: 30, marginTop: 12}}>
          {[props.bedrooms ? `${props.bedrooms} bed` : '', props.bathrooms ? `${props.bathrooms} bath` : '', props.area ? `${props.area} sq ft` : ''].filter(Boolean).join(' • ')}
        </div>
      </div>
      <div style={{...panel, bottom: 70, textAlign: 'center', fontSize: 30, fontWeight: 700}}>
        {props.cta}
      </div>
    </AbsoluteFill>
  );
};
