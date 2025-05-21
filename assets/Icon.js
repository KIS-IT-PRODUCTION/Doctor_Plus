// assets/Icon.js (Простий компонент SVG для заміни icon.svg)
import React from 'react';
import Svg, { Rect } from 'react-native-svg';

const Icon = ({ width = 50, height = 50, color = '#42A5F5' }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 50 50">
      <Rect x="0" y="0" width="50" height="50" fill={color} rx="10" ry="10" />
      {/* Можна додати складніші SVG елементи тут */}
    </Svg>
  );
};

export default Icon;

