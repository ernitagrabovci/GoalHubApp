import { LegalPage, type LegalSection } from '@/components/legal/legal-page';

const SECTIONS: LegalSection[] = [
  {
    title: '1. Të dhënat që mbledhim',
    paragraphs: [
      'GoalHub mbledh vetëm të dhënat e nevojshme për funksionimin e aplikacionit, duke përfshirë emrin, email-in, të dhënat sportive (statistikat, prezencën dhe vlerësimet) dhe të dhënat financiare (pagesat dhe statusin e kuotave).',
      'Të dhënat përdoren për menaxhimin e llogarisë, ekipeve, performancës sportive dhe pagesave.',
      'Nuk i shesim të dhënat personale dhe nuk i përdorim për qëllime reklamimi pa pëlqimin tuaj.',
    ],
  },
  {
    title: '2. Ruajtja dhe siguria',
    paragraphs: [
      'Të dhënat ruhen në serverë të sigurt dhe komunikimi mbrohet përmes SSL/TLS encryption. Përdorim masa të arsyeshme teknike dhe organizative për të parandaluar qasjen e paautorizuar, humbjen ose keqpërdorimin e të dhënave.',
      'Kryhen backup-e automatike për të ndihmuar në mbrojtjen dhe rikuperimin e të dhënave.',
      'Të dhënat ruhen vetëm për aq kohë sa është e nevojshme për ofrimin e shërbimeve dhe për përmbushjen e detyrimeve ligjore.',
    ],
  },
  {
    title: '3. Ndarja e të dhënave',
    paragraphs: [
      'GoalHub nuk shet ose jep të dhënat personale për qëllime marketingu. Të dhënat mund të përpunohen nga ofrues të autorizuar të shërbimeve teknike, hosting-ut ose pagesave vetëm kur kjo është e nevojshme për funksionimin e aplikacionit dhe në përputhje me kërkesat e privatësisë.',
    ],
  },
  {
    title: '4. Të drejtat tuaja',
    paragraphs: [
      'Ju keni të drejtë të kërkoni akses, korrigjim, përditësim ose fshirje të të dhënave tuaja personale, në përputhje me ligjin në fuqi. Mund të kërkoni gjithashtu kufizimin ose kundërshtimin e përpunimit kur është e aplikueshme.',
      'Për kërkesa lidhur me privatësinë, kontaktoni: contact@div-ks.com',
      'GoalHub synon të respektojë parimet e GDPR dhe kërkesat e aplikueshme të privatësisë për përdoruesit në platformat iOS dhe Android.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return <LegalPage title="Politika e Privatësisë" sections={SECTIONS} />;
}
