import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { LegalPage, type LegalSection } from '@/components/legal/legal-page';
import { Fonts } from '@/constants/theme';
import { scaled } from '@/lib/responsive';

const C = {
  green: '#159447',
  red: '#ED5050',
};

const SECTIONS: LegalSection[] = [
  {
    title: '1. Çfarë janë cookies?',
    paragraphs: [
      'Cookies janë skedarë të vegjël teksti që ruhen në pajisjen tuaj kur përdorni GoalHub përmes një shfletuesi. Ato ndihmojnë në funksionimin e platformës, ruajtjen e sesionit dhe mbajtjen mend të disa preferencave tuaja.',
    ],
  },
  {
    title: '2. Llojet e cookies që përdorim',
    paragraphs: [
      'GoalHub mund të përdorë cookies thelbësore për autentikimin, sigurinë dhe funksionimin e llogarisë, cookies funksionale për ruajtjen e preferencave si gjuha ose tema dhe, kur aktivizohen, cookies analitike për të kuptuar përdorimin dhe performancën e platformës.',
    ],
  },
  {
    title: '3. Qëllimi i përdorimit',
    paragraphs: [
      'Cookies përdoren për të mbajtur sesionin tuaj aktiv, për të ruajtur cilësimet dhe preferencat tuaja, për të ofruar funksione të sigurta dhe për të përmirësuar performancën dhe përvojën e përdorimit të GoalHub.',
      'Nuk përdorim cookies për reklamim të personalizuar dhe nuk i shesim të dhënat e mbledhura përmes tyre.',
    ],
  },
  {
    title: '4. Cookies nga palë të treta',
    paragraphs: [
      'Disa cookies mund të vendosen nga ofrues të autorizuar të shërbimeve që përdorim për funksione të tilla si autentikimi, siguria, hosting-u ose analiza e përdorimit. Këta ofrues mund të kenë politikat e tyre të privatësisë dhe cookies.',
    ],
  },
  {
    title: '5. Menaxhimi i cookies',
    paragraphs: [
      'Ju mund të kontrolloni, kufizoni ose fshini cookies përmes cilësimeve të shfletuesit tuaj. Megjithatë, çaktivizimi i cookies thelbësore mund të bëjë që disa funksione të GoalHub të mos funksionojnë siç duhet.',
      'Nëse GoalHub ofron një mekanizëm për menaxhimin e pëlqimit për cookies, mund të ndryshoni preferencat tuaja përmes atij mekanizmi.',
    ],
  },
  {
    title: '6. Kontakti',
    paragraphs: [
      'Për çdo pyetje lidhur me përdorimin e cookies dhe privatësinë, mund të na kontaktoni në: contact@div-ks.com',
    ],
  },
];

export default function CookiesPolicyScreen() {
  return (
    <LegalPage
      title="Politika e Cookies"
      sections={SECTIONS}
      footer={
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.allowAll, pressed && styles.pressed]}
          >
            <Text style={styles.btnLight}>Prano të gjitha cookies</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.necessary, pressed && styles.pressed]}
          >
            <Text style={styles.btnGreen}>Prano vetëm cookies e nevojshme</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.btn, styles.denyAll, pressed && styles.pressed]}
          >
            <Text style={styles.btnLight}>Refuzo të gjitha cookies</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create(
  scaled({
    actions: {
      marginTop: 26,
      gap: 9,
    },

    btn: {
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      paddingHorizontal: 14,
    },

    allowAll: {
      backgroundColor: C.green,
    },

    necessary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: C.green,
    },

    denyAll: {
      backgroundColor: C.red,
    },

    btnLight: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13.5,
      color: '#FFFFFF',
    },

    btnGreen: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13.5,
      color: C.green,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
