// theme/theme.ts

import { createTheme } from '@rneui/themed';

export const theme = createTheme({
  lightColors: {
    primary: '#3D5AF1',
    secondary: '#38b6ff',
    background: '#F8F9FF',
    white: '#FFFFFF',
    black: '#2E384D',
    grey0: '#F8F9FF',
    grey1: '#EDF1F7',
    grey2: '#C5CEE0',
    grey3: '#8F9BB3',
    grey4: '#5E6C84',
    grey5: '#2E384D',
    success: '#00E096',
    warning: '#FFAA00',
    error: '#FF3D71',
    disabled: '#EDF1F7',
    divider: '#EDF1F7',
  },
  darkColors: {
    primary: '#5073F2',
    secondary: '#54C7FF',
    background: '#1A2138',
    white: '#FFFFFF',
    black: '#151A30',
    grey0: '#1A2138',
    grey1: '#252D42',
    grey2: '#394056',
    grey3: '#8F9BB3',
    grey4: '#B7BED0',
    grey5: '#EDF1F7',
    success: '#00E096',
    warning: '#FFAA00',
    error: '#FF3D71',
    disabled: '#394056',
    divider: '#252D42',
  },
  mode: 'light',
  components: {
    Button: {
      raised: true,
      buttonStyle: {
        borderRadius: 10,
        paddingVertical: 12,
      },
      containerStyle: {
        borderRadius: 10,
      },
      titleStyle: {
        fontWeight: 'bold',
      },
    },
    Input: {
      containerStyle: {
        paddingHorizontal: 0,
      },
      inputContainerStyle: {
        borderBottomWidth: 0,
        backgroundColor: 'transparent',
      },
      inputStyle: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      leftIconContainerStyle: {
        marginLeft: 12,
        marginRight: 8,
      },
      rightIconContainerStyle: {
        marginRight: 12,
        marginLeft: 8,
      },
      errorStyle: {
        margin: 5,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 0,
      },
    },
    Text: {
      h1Style: {
        fontWeight: 'bold',
        fontSize: 32,
      },
      h2Style: {
        fontWeight: 'bold',
        fontSize: 28,
      },
      h3Style: {
        fontWeight: 'bold',
        fontSize: 24,
      },
      h4Style: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    },
    Divider: {
      style: {
        marginVertical: 10,
      },
    },
  },
});