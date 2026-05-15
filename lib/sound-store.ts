import { createSoundStore } from '@davstack/sound';

export const soundStore = createSoundStore({
  soundNameToPath: {
    messageReceived: '/sounds/message-received.mp3',
    messageSent: '/sounds/message-sent.mp3',
  },
  defaultVolume: 0.7,
  allowMultiple: true,
});
