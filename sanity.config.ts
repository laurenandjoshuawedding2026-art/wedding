import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemaTypes'
import { GuestListReport } from './app/components/GuestListReport'
import { WishesReport } from './app/components/WishesReport'
import { UsersIcon, HeartIcon } from '@sanity/icons'

export default defineConfig({
  name: 'default',
  title: 'Wedding Invite Studio',

  projectId: '6utncmxh', 
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            ...S.documentTypeListItems(),
            S.divider(),
            S.listItem()
              .title('Guest List Report')
              .icon(UsersIcon)
              .child(
                S.component(GuestListReport).title('Professional Guest Overview')
              ),
            S.listItem()
              .title('Wall of Love')
              .icon(HeartIcon)
              .child(
                S.component(WishesReport).title('Guest Wishes & Well-Messages')
              ),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})