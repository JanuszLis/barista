# fluid-tab

This is a experimental version of the tab component. It registers itself as
`fluid-tab` custom element.

## Properties

| Property   | Attribute  | Type      | Default                    | Description                                  |
| ---------- | ---------- | --------- | -------------------------- | -------------------------------------------- |
| `selected` | `selected` | `boolean` |                            | Defines whether a tab is selected or not     |
| `disabled` | `disabled` | `boolean` |                            | Defines whether a tab is disabled or not     |
| `tabid`    | `tabid`    | `string`  | "`fluid-tab-${_unique++}`" | Defines the tab element with an id attribute |
| `tabindex` | `tabindex` | `number`  |                            | Defines the tabindex attribute               |

## Slots

| Name | Description                                  |
| ---- | -------------------------------------------- |
|      | Default slot to provide a label for the tab. |

# fluid-tag-group

This is a experimental version of the tab group component. It registers itself
as `fluid-tab-group` custom element.

## Properties

| Property        | Attribute       | Type     | Description                  |
| --------------- | --------------- | -------- | ---------------------------- |
| `selectedtabid` | `selectedtabid` | `string` | Defines a tab to be selected |

## Slots

| Name | Description                                               |
| ---- | --------------------------------------------------------- |
|      | Default slot lets the user provide a group of fluid-tabs. |
