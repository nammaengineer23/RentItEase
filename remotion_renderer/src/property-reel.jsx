import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
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
  zIndex: 20,
};

const Photo = ({src}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 12, durationInFrames - 12, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#111', opacity, zIndex: 0}}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.68))', zIndex: 1}} />
    </AbsoluteFill>
  );
};

export const PropertyReel = (props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const images = (props.imageUrls || []).filter(Boolean).slice(0, 8);
  const framesPerImage = Math.max(90, Math.floor(900 / Math.max(images.length, 1)));
  const intro = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  const titleY = interpolate(intro, [0, 1], [40, 0]);
  const titleOpacity = interpolate(intro, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{background: '#111'}}>
      {images.map((src, index) => (
        <Sequence key={src + index} from={index * framesPerImage} durationInFrames={framesPerImage}>
          <Photo src={src} />
        </Sequence>
      ))}
      <div style={{...panel, top: 90, zIndex: 30, transform: `translateY(${titleY}px)`, opacity: titleOpacity}}>
        <div style={{fontSize: 58, fontWeight: 800, lineHeight: 1.08}}>{props.title}</div>
        {props.location ? <div style={{fontSize: 32, marginTop: 14}}>📍 {props.location}</div> : null}
      </div>
      <div style={{...panel, bottom: 230, zIndex: 30}}>
        {props.price ? <div style={{fontSize: 54, fontWeight: 800}}>₹{props.price}/month</div> : null}
        <div style={{fontSize: 30, marginTop: 12}}>
          {[props.bedrooms ? `${props.bedrooms} bed` : '', props.bathrooms ? `${props.bathrooms} bath` : '', props.area ? `${props.area} sq ft` : '', props.propertyType || ''].filter(Boolean).join(' • ')}
        </div>
      </div>
      <div style={{...panel, bottom: 70, zIndex: 30, textAlign: 'center', fontSize: 30, fontWeight: 700}}>
        {props.cta || 'Find your next home on RentItEase • rentitease.com'}
      </div>
    </AbsoluteFill>
  );
};
