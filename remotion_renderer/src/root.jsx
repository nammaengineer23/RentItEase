import React from 'react';
import {Composition} from 'remotion';
import {PropertyReel} from './property-reel.jsx';

const defaults = {
  title: 'RentItEase Property',
  price: '',
  location: '',
  bedrooms: null,
  bathrooms: null,
  area: null,
  propertyType: '',
  imageUrls: [],
  propertyVideoUrl: null,
  cta: 'Find your next home on RentItEase • rentitease.com',
};

export const Root = () => (
  <Composition
    id="RentItEasePropertyReel"
    component={PropertyReel}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={900}
    defaultProps={defaults}
  />
);
