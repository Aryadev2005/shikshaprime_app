import {
  useFonts,
  InstrumentSerif_400Regular,
} from '@expo-google-fonts/instrument-serif';

export const useAppFonts = () =>
  useFonts({ InstrumentSerif: InstrumentSerif_400Regular });
