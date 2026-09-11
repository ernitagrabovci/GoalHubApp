import { LegalPage, type LegalSection } from '@/components/legal/legal-page';

const SECTIONS: LegalSection[] = [
  {
    title: '1. Pranimi i kushteve',
    paragraphs: [
      'Duke krijuar një llogari ose duke përdorur GoalHub, ju pranoni këto Kushte të Shërbimit dhe angazhoheni t’i respektoni ato. Nëse nuk jeni dakord me këto kushte, ju lutemi mos përdorni aplikacionin.',
    ],
  },
  {
    title: '2. Përdorimi i platformës',
    paragraphs: [
      'GoalHub duhet të përdoret vetëm për qëllime të ligjshme dhe në përputhje me këto kushte. Ndalohet përdorimi i platformës për aktivitete të paligjshme, mashtruese, abuzive ose për të dëmtuar funksionimin apo sigurinë e shërbimit.',
    ],
  },
  {
    title: '3. Llogaritë dhe siguria',
    paragraphs: [
      'Përdoruesit janë përgjegjës për saktësinë e informacionit të dhënë gjatë regjistrimit dhe për ruajtjen e konfidencialitetit të llogarisë së tyre. Çdo aktivitet i kryer përmes llogarisë së përdoruesit konsiderohet përgjegjësi e tij, përveç rasteve të përdorimit të paautorizuar të raportuar te GoalHub.',
    ],
  },
  {
    title: '4. Pagesat dhe kuotat',
    paragraphs: [
      'Nëse përdorni funksionet e pagesave të GoalHub, ju pranoni të paguani detyrimet dhe kuotat përkatëse sipas kushteve të përcaktuara nga klubi, organizata ose shërbimi përkatës. Informacioni i pagesave mund të përpunohet përmes ofruesve të autorizuar të pagesave.',
    ],
  },
  {
    title: '5. Pronësia intelektuale',
    paragraphs: [
      'Platforma GoalHub, duke përfshirë softuerin, kodin, dizajnin, logot, tekstet, elementet grafike dhe përmbajtjen e krijuar nga GoalHub, mbrohet nga ligjet për pronësinë intelektuale. Nuk lejohet kopjimi, shpërndarja, modifikimi ose përdorimi i paautorizuar i tyre.',
      'Të dhënat dhe përmbajtja e ofruar nga përdoruesit mbeten në pronësi të tyre, ndërsa përdoruesi i jep GoalHub të drejtën e nevojshme për t’i ruajtur dhe përpunuar ato për ofrimin e shërbimit.',
    ],
  },
  {
    title: '6. Disponueshmëria dhe përgjegjësia',
    paragraphs: [
      'Ne përpiqemi ta mbajmë GoalHub të sigurt dhe funksional, por nuk garantojmë që platforma do të jetë gjithmonë e disponueshme ose pa ndërprerje dhe gabime. GoalHub nuk është përgjegjës për dëme indirekte ose humbje që rezultojnë nga përdorimi ose pamundësia për të përdorur platformën, në masën e lejuar nga ligji.',
    ],
  },
  {
    title: '7. Pezullimi ose mbyllja e llogarisë',
    paragraphs: [
      'GoalHub mund të kufizojë, pezullojë ose mbyllë një llogari në rast të shkeljes së këtyre kushteve, përdorimit të paligjshëm të platformës ose rrezikut për sigurinë e shërbimit ose përdoruesve.',
    ],
  },
  {
    title: '8. Ndryshimet e kushteve',
    paragraphs: [
      'Ne mund t’i përditësojmë këto Kushte të Shërbimit kur është e nevojshme. Për ndryshime të rëndësishme, përdoruesit do të njoftohen përmes aplikacionit ose mjeteve të tjera të përshtatshme. Vazhdimi i përdorimit të GoalHub pas hyrjes në fuqi të ndryshimeve nënkupton pranimin e kushteve të përditësuara.',
    ],
  },
  {
    title: '9. Kontakti',
    paragraphs: [
      'Për pyetje, kërkesa ose çështje ligjore lidhur me këto kushte, na kontaktoni në: contact@div-ks.com',
    ],
  },
];

export default function TermsConditionsScreen() {
  return <LegalPage title="Kushtet e Shërbimit" sections={SECTIONS} />;
}
