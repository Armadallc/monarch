# Homepage nav links not clickable until scroll — fix

## Problem
When the homepage loads, the NAV BAR links (HOME, ABOUT, OUR PROGRAM, REFERRALS, etc.) are not clickable. After scrolling down a little, they become selectable.

## Cause
On the homepage (`/`), the Hero section is full viewport height (100vh) and contains absolute-positioned layers (background Image and Dots) that cover the whole hero. The NAV BAR is rendered in the same area (top of page). In stacking order, those hero layers can sit on top of the nav, so they receive the clicks until the user scrolls and the layout shifts.

The **ScrollBlurTop** code component already uses `pointerEvents: "none"`, so it is not blocking clicks. The issue is the Hero’s background layers (and/or their stacking context) being above the nav.

## Fix (in Framer)
1. Open the Monarch project in Framer and go to the **homepage** (or the frame that contains the global nav).
2. Locate the **NAV BAR** component (or the frame that contains the top navigation links).
3. In the right-hand panel, set **z-index** to a value **higher than** the Hero and ScrollBlurTop (e.g. **10** or **100**), so the nav always paints and receives clicks on top.
4. If the nav is inside a sticky/fixed frame, ensure that frame has the higher z-index.
5. Publish the site and test: nav links should be clickable as soon as the homepage loads.

## Optional check
If the nav is inside the Hero’s **HeadlineContent** (or similar) area, ensure that parent frame has a higher z-index than the Hero’s background Image and Dots, or move the nav to a fixed/sticky layer at the site level with a high z-index.
