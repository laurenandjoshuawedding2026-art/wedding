import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'guest',
  title: 'Guest List',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      description: 'The name as it should appear on the invitation search (e.g., "John Smith")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      description: 'The unique URL part for this guest. Click "Generate" after entering the name.',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seats_reserved',
      title: 'Seats Reserved',
      type: 'number',
      description: 'Total number of seats allocated to this guest/party',
      initialValue: 1,
    }),
    defineField({
      name: 'table_number',
      title: 'Table Number',
      type: 'number',
    }),
    defineField({
      name: 'RSVP_status',
      title: 'RSVP Status',
      type: 'string',
      options: {
        list: [
          { title: 'Attending', value: 'attending' },
          { title: 'Declined', value: 'declined' },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: 'attending_count',
      title: 'Attending Count',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'timeline',
      title: 'Personalized Timeline',
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
      description: 'Optional: Override the default timeline for this specific guest',
    }),
  ],
})