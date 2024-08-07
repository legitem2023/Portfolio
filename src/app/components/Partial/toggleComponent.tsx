'use client'
import React from 'react';
import useToggle from '../../../../Store/useToggle';
import { Icon } from '@iconify/react/dist/iconify.js';

const ToggleComponent: React.FC = () => {
  const {toggle } = useToggle();

  return (
    <Icon onClick={toggle} className='NavIcon' icon="fluent:navigation-24-filled"></Icon>
  );
};

export default ToggleComponent;
