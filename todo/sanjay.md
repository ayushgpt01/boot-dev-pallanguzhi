# Todos

## Fixes

- [ ] make the game logic move anti-clock wise
- [ ] when having no seeds in hand should only be able to pick the seeds from the next pit from where the last seed was placed. Curretly can pick up seeds from any pit out there.

## In-Progress

- [ ] Interactivity
  - [ ] Pick the shells from one pit and put then in the following pits
    - [ ] Click a pit → pick up all seeds from it.
    - [ ] Animate moving seeds into the next pits (anti-clockwise).
    - [ ] Drop one seed per pit in sequence.

⸻

## Tasks

- [x] Initialize PixiJS app and add to canvas

- [ ] board
  - [x] Render 14 pits (6 per player + 2 stores)
  - [ ] better visuals of the board

- [ ] Seeds
  - [ ] At the start of the game place seeds on each pit with a visual
  - [ ] Draw seeds dynamically based on game state
  - [ ] Animation of seeds when picking up

- [ ] Add interactivity: highlight pits on hover, handle pit clicks
- [ ] Highlight the pits on hover.
- [ ] Handle pit clicks.
- [ ] Handle seeds pickup.
- [ ] Handling moving the handle with holding seeds that were picked up.

- [ ] Animate seed movement across pits

## Mini-Tasks

- [x] Download the font and put into inside public/fonts
- [ ] Add Favicon
- [ ] pixi for different functionality

## Sprites

### Seeds

- [ ] Making the seeds fill into each pit ( this is what's supposed to happen on the start of the game.)

### Pit

#### Questions

? What is the seed supposed to look like

#### General Notes

#### Completed

- [x] Reduce the size of the seeds
- [x] Put five seeds on each pit

Use PixiJS to visually render the game board, pits, and seeds. Ensure the rendering is in sync with the game state. Add basic interactivity for clicking pits. (For now leave empty functions)

Checklist:

- [x] Initialize PixiJS app and add to canvas

- [x] Render 14 pits (6 per player + 2 stores)

- [x] Draw seeds dynamically based on game state

- [x] Add interactivity: highlight pits on hover, handle pit clicks

- [ ] Animate seed movement across pits
