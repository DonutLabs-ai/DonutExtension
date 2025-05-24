export default {
  plugins: {
    'postcss-rem-to-responsive-pixel': {
      rootValue: 16, // 1rem = 16px
      propList: ['*'], // Transform all attributes
      exclude: [/node_modules/i],
      transformUnit: 'px', // Output unit is px
      replace: true, // Replace instead of adding fallback
      mediaQuery: false, // Do not transform rem in media queries
    },
  },
};
