const path = require('path');
module.exports = {
    stories: ['../src/**/*.stories.[tj]s'],
    addons: ['@storybook/preset-typescript',
        '@storybook/addon-knobs/register',
        {
            name: '@storybook/addon-storysource',
            options: {
                rule: {
                    include: [path.resolve(__dirname, '../src')], // You can specify directories
                },
                loaderOptions: {
                    prettierConfig: { printWidth: 80, singleQuote: false },
                },
            },
        },
    ]
};