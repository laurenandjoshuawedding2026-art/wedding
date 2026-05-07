import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'wish',
  title: 'Guest Wishes',
  type: 'document',
  fields: [
    defineField({
      name: 'guestName',
      title: 'Guest Name',
      type: 'string',
      description: 'Name of the guest who left the wish.',
      readOnly: true, // This will be set by the app, not manually
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      description: 'The wish or message left by the guest.',
      validation: (Rule) => Rule.required().min(10).max(500),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DDTHH:mm:ssZ',
      },
      readOnly: true, // Automatically set on creation
    }),
  ],
  preview: {
    select: {
      title: 'guestName',
      subtitle: 'message',
      date: 'createdAt',
    },
    prepare({ title, subtitle, date }) {
      return {
        title: title || 'Anonymous Wish',
        subtitle: `${subtitle?.substring(0, 50)}... (${new Date(date).toLocaleDateString()})`,
      };
    },
  },
})