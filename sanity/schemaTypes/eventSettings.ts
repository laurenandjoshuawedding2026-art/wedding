import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'eventSettings',
  title: 'Event Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'backgroundMusic',
      title: 'Background Music',
      type: 'array',
      of: [
        {
          type: 'file',
          options: {
            accept: 'audio/*',
          },
        },
      ],
      description: 'Upload MP3 files for the background music playlist.',
    }),
    defineField({
      name: 'weddingDate',
      title: 'Wedding Date & Time',
      type: 'datetime',
      description: 'The official date and time of the ceremony for the countdown timer and display text.',
      initialValue: '2026-07-04T15:00:00Z',
    }),
    defineField({
      name: 'thankYouVideo',
      title: 'Thank You Video',
      type: 'file',
      options: {
        accept: 'video/*',
      },
      description: 'Upload a personalized video message for guests who accept the invitation.',
    }),
    defineField({
      name: 'venueName',
      title: 'Venue Name',
      type: 'string',
    }),
    defineField({
      name: 'venueAddress',
      title: 'Venue Address',
      type: 'string',
    }),
    defineField({
      name: 'venueDetails',
      title: 'Venue Details',
      type: 'string',
      description: 'e.g., Ceremony begins at 3:00 PM',
    }),
    defineField({
      name: 'attireDescription',
      title: 'Attire Description',
      type: 'text',
    }),
    defineField({
      name: 'giftingDescription',
      title: 'Gifting Description',
      type: 'text',
    }),
    defineField({
      name: 'ogFallbackImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description: 'Image used for social media previews when no specific invite image is set (e.g., for the home page).',
    }),
    defineField({
      name: 'inviteOgImage',
      title: 'Invitation Open Graph Image',
      type: 'image',
      description: 'Image used for social media previews when sharing an individual invitation link.',
    }),
    defineField({
      name: 'roseModelTopLeft',
      title: 'Top Left Rose Model (.glb)',
      type: 'file',
      options: { accept: '.glb' },
      description: '3D model for the top left corner.',
    }),
    defineField({
      name: 'roseModelTopRight',
      title: 'Top Right Rose Model (.glb)',
      type: 'file',
      options: { accept: '.glb' },
      description: '3D model for the top right corner.',
    }),
    defineField({
      name: 'roseModelBottomLeft',
      title: 'Bottom Left Rose Model (.glb)',
      type: 'file',
      options: { accept: '.glb' },
      description: '3D model for the bottom left corner.',
    }),
    defineField({
      name: 'roseModelBottomRight',
      title: 'Bottom Right Rose Model (.glb)',
      type: 'file',
      options: { accept: '.glb' },
      description: '3D model for the bottom right corner.',
    }),
    defineField({
      name: 'timeline',
      title: 'Global Timeline',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'time', title: 'Time', type: 'string' },
            { name: 'event', title: 'Event', type: 'string' },
          ],
        },
      ],
    }),
  ],
})