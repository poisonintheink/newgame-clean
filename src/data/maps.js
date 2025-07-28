export default {
  overworld: {
    width: 5,
    height: 5,
    tiles: [
      [{ type: 'grass' }, { type: 'grass' }, { type: 'water' }, { type: 'grass' }, { type: 'grass' }],
      [{ type: 'grass' }, { type: 'dirt' }, { type: 'dirt' }, { type: 'dirt' }, { type: 'grass' }],
      [{ type: 'grass' }, { type: 'dirt' }, { type: 'water' }, { type: 'dirt' }, { type: 'grass' }],
      [{ type: 'grass' }, { type: 'dirt' }, { type: 'dirt' }, { type: 'dirt' }, { type: 'grass' }],
      [{ type: 'grass' }, { type: 'grass' }, { type: 'grass' }, { type: 'grass' }, { type: 'grass' }]
    ]
  },
  dungeon: {
    width: 5,
    height: 5,
    tiles: [
      [{ type: 'wall' }, { type: 'wall' }, { type: 'wall' }, { type: 'wall' }, { type: 'wall' }],
      [{ type: 'wall' }, { type: 'stone' }, { type: 'stone' }, { type: 'stone' }, { type: 'wall' }],
      [{ type: 'wall' }, { type: 'stone' }, { type: 'water' }, { type: 'stone' }, { type: 'wall' }],
      [{ type: 'wall' }, { type: 'stone' }, { type: 'stone' }, { type: 'stone' }, { type: 'wall' }],
      [{ type: 'wall' }, { type: 'wall' }, { type: 'wall' }, { type: 'wall' }, { type: 'wall' }]
    ]
  }
};