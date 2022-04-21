import React from 'react';

import { Button } from '../components/Button';

export default {
  title: 'Button',
  component: Button,
};

//👇 We create a “template” of how args map to rendering
const Template = (args) => <Button {...args} />;

// 👇 Each story then reuses that template
export const Primary = Template.bind({});
Primary.args = { type: 'primary', label: 'Primary' };

export const Error = Template.bind({});
Error.args = { type: 'error', label: 'Error' };