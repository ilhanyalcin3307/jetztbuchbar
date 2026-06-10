#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  {
    file: 'griechenland/zakynthos/index.html',
    destination: 'Zakynthos',
    whyTitle: 'Warum Zakynthos für DACH-Reisende?',
    whyText: 'Zakynthos ist für Reisende aus Deutschland, Österreich und der Schweiz interessant, weil die Insel eine seltene Mischung aus kurzer Flugzeit, klarer Urlaubslogik und starker Bildsprache bietet. Direktflüge in der Saison, kompakte Wege und eine gute Balance aus Natur, Badeurlaub und Ausflugsmöglichkeiten machen die Planung einfach. Wer türkisblaue Buchten, ruhige Familienorte und ikonische Highlights wie Navagio sucht, bekommt hier viel Postkartenfaktor ohne die Preisniveaus von Santorini oder Mykonos. Für DACH-Reisende ist außerdem wichtig, dass sich Zakynthos sowohl für klassische Pauschalreisen als auch für individuellere Hotelaufenthalte eignet. Orte wie Tsilivi oder Alykes funktionieren für Familien, während Paare eher ruhige Buchten, Adults-friendly Hotels und Bootsausflüge schätzen. Dazu kommt: Die Insel ist überschaubar genug, um in einer Woche mehrere Facetten mitzunehmen, ohne ständig die Unterkunft wechseln zu müssen. Genau diese Mischung aus Erreichbarkeit, Naturerlebnis und kalkulierbarem Urlaubsbudget macht Zakynthos zu einem starken Long-Haul-Ersatz innerhalb Europas.',
    tips: [
      'Morgens zu Aussichtspunkten rund um Navagio fahren: weniger Busse, besseres Licht und deutlich entspannter.',
      'Für Familien eher Tsilivi oder Alykes wählen, nicht die lauteren Abschnitte rund um Laganas.',
      'Bootstouren nur bei ruhiger See spontan vor Ort buchen, weil Wetter und Sicht stark variieren können.'
    ],
    extraFaq: [
      ['Welche Orte sind auf Zakynthos am ruhigsten?', 'Alykes, Alykanas und Teile von Vasilikos gelten als entspannter als die Partyzonen im Süden.'],
      ['Ist ein Mietwagen auf Zakynthos sinnvoll?', 'Ja, vor allem wenn du mehrere Buchten, Aussichtspunkte und kleinere Strände flexibel erreichen willst.'],
      ['Eignet sich Zakynthos für Paare?', 'Ja. Vor allem ruhigere Hotels mit Meerblick und Bootsausflügen machen die Insel für Paare attraktiv.']
    ]
  },
  {
    file: 'tuerkei/fethiye/index.html',
    destination: 'Fethiye',
    whyTitle: 'Warum Fethiye für DACH-Reisende?',
    whyText: 'Fethiye passt besonders gut zu DACH-Reisenden, die nicht nur Strand, sondern auch Landschaft, Aktivitäten und ein etwas individuelleres Türkei-Gefühl suchen. Die Region kombiniert Ölüdeniz, Bootstouren, Bergkulisse und kleinere Buchten mit einer touristischen Infrastruktur, die deutlich entspannter wirkt als klassische Großresort-Zonen. Das macht Fethiye zu einer starken Option für Paare, aktive Urlauber und Familien, die Natur und Meer verbinden wollen. Dazu kommt ein gutes Preis-Leistungs-Verhältnis: Wer aus Deutschland, Österreich oder der Schweiz anreist, findet oft attraktive Pakete über Dalaman, ohne dass der Urlaub künstlich luxuriös wirken muss. Gerade für Reisende, die zwischen klassischem All Inclusive und freierem Urlaubsstil schwanken, ist Fethiye attraktiv. Man kann Strandtage, Ausflüge, Paragliding, Bootstage und Altstadtatmosphäre in einer Reise kombinieren. Für DACH-Reisende zählt außerdem die gute Planbarkeit: Wetterfenster, Transferzeiten und Hotelstandorte lassen sich relativ klar vergleichen. Genau diese Mischung aus Naturkulisse, Aktivprogramm und vernünftigem Budget macht Fethiye zu einer der vielseitigsten Türkei-Destinationen im JetztBuchbar-Kontext.',
    tips: [
      'Hotels in Ölüdeniz wirken bildstark, aber Unterkünfte in Çalış oder zentral Fethiye sind oft entspannter und günstiger.',
      'Bootsausflüge früh im Urlaub einplanen, damit du Schlechtwettertage notfalls kompensieren kannst.',
      'Paragliding über Ölüdeniz nur bei etablierten Anbietern buchen und Windbedingungen ernst nehmen.'
    ],
    extraFaq: [
      ['Welcher Bereich in Fethiye eignet sich für Familien?', 'Çalış Beach und ruhigere Hotels rund um Ölüdeniz sind für Familien meist angenehmer als sehr aktive Ausflugszonen.'],
      ['Ist Fethiye eher Strandurlaub oder Aktivurlaub?', 'Beides. Genau diese Mischung ist einer der größten Vorteile der Region.'],
      ['Wie lang ist der Transfer ab Dalaman?', 'Je nach Hotel meist 45 bis 70 Minuten, in Randlagen auch etwas länger.']
    ]
  },
  {
    file: 'tuerkei/antalya/index.html',
    destination: 'Antalya',
    whyTitle: 'Warum Antalya für DACH-Reisende?',
    whyText: 'Antalya ist für DACH-Reisende vor allem deshalb stark, weil die Region maximale Verfügbarkeit mit klarer Urlaubssicherheit verbindet. Viele Direktflüge, große Hotelkapazitäten, starke Familienresorts und sehr unterschiedliche Teilregionen machen Antalya planbar. Wer aus Deutschland, Österreich oder der Schweiz reist, kann zwischen Lara, Belek, Kemer und Side-nahem Umfeld sehr genau nach Reisetyp auswählen. Das ist ein echter Vorteil gegenüber vielen Zielen, bei denen die Destination zwar beliebt ist, aber die Hotellage schwerer vergleichbar bleibt. Gleichzeitig ist Antalya breit genug aufgestellt, um nicht nur als klassisches All-Inclusive-Ziel zu funktionieren. Familien finden Wasserpark-Resorts und kurze Transfers, Paare eher ruhigere Adults-orientierte Häuser oder Hotelanlagen mit höherem Servicelevel. Dazu kommen Stadt- und Naturaspekte: Kaleiçi, Düden-Wasserfälle und Canyons erweitern den reinen Strandurlaub. Für DACH-Reisende ist auch das Preis-Leistungs-Verhältnis relevant. Gerade außerhalb der Hochsaison ist Antalya oft deutlich effizienter als Südeuropa, wenn man Ausstattung, Wetterstabilität und Flugangebot zusammen betrachtet. Genau deshalb bleibt Antalya eine der wichtigsten Vergleichs-Destinationen im SEO-Fokus.',
    tips: [
      'Bei kurzen Aufenthalten lieber Lara oder zentrumsnahe Hotels wählen, damit der Transfer nicht zu viel Zeit frisst.',
      'Für Familien Wasserpark und Kinderbetreuung vor Buchung prüfen, weil nicht jedes große Resort wirklich kinderfreundlich ist.',
      'Mai, Juni und Oktober liefern oft das bessere Preis-Leistungs-Verhältnis als die sehr heißen Hochsommerwochen.'
    ],
    extraFaq: [
      ['Welche Region in Antalya ist für Familien am besten?', 'Lara und Belek sind wegen kurzer Wege, Resortdichte und Familienangebot oft die sichersten Optionen.'],
      ['Ist Antalya auch für Paare geeignet?', 'Ja, vor allem höherwertige Resorts und ruhigere Hotelanlagen bieten viel Komfort für Paare.'],
      ['Wann sind Antalya-Hotels am günstigsten?', 'Oft in den Randmonaten Mai und Oktober, wenn Wetter und Wasser noch gut, Preise aber niedriger sind.']
    ]
  },
  {
    file: 'tuerkei/marmaris/index.html',
    destination: 'Marmaris',
    whyTitle: 'Warum Marmaris für DACH-Reisende?',
    whyText: 'Marmaris ist für DACH-Reisende vor allem dann interessant, wenn eine Türkei-Reise etwas maritimer, beweglicher und städtischer wirken soll als klassische Resortzonen. Die Mischung aus Marina, Buchten, Içmeler-Nähe und Ausflugsmöglichkeiten in Richtung Dalyan oder Datça erzeugt einen Urlaubstyp, der zwischen Badeferien und Küstenstadt liegt. Das spricht besonders Paare, Freundesgruppen und Reisende an, die nicht nur im Resort bleiben wollen. Für DACH-Reisende ist außerdem relevant, dass Marmaris im internationalen Vergleich oft günstiger bleibt als mediterrane Yachthafen-Destinationen in Spanien, Italien oder Südfrankreich. Gleichzeitig ist das Ziel touristisch etabliert genug, um Transfers, Hoteloptionen und Aktivitäten ohne großen Reibungsverlust planbar zu machen. Die Region profitiert zudem von einer guten Kombination aus Meer, Nightlife und Tagesausflugspotenzial. Wer eine klassische Sonnenziel-Alternative mit mehr Promenade, mehr Bewegung und mehr Abwechslung sucht, findet in Marmaris ein starkes Profil. Gerade im Kontext organischer Suche ist das wichtig, weil Marmaris nicht einfach nur als Strandziel funktioniert, sondern über Marina, Ausflüge, Preisniveau und Reisetyp deutlich besser differenzierbar ist.',
    tips: [
      'Für ruhigeren Urlaub eher Içmeler oder Randlagen statt der lauteren Promenadenabschnitte wählen.',
      'Bootsausflüge und Dalyan-Trips früh reservieren, wenn du in Ferienzeiten reist.',
      'Bei Marina-nahen Hotels prüfen, ob dir Abendtrubel oder Schlafruhe wichtiger ist.'
    ],
    extraFaq: [
      ['Ist Marmaris eher Party oder Erholung?', 'Beides ist möglich. Die genaue Hotellage entscheidet stark über das Urlaubserlebnis.'],
      ['Welche Gegend ist in Marmaris am ruhigsten?', 'Içmeler und etwas außerhalb gelegene Buchten sind oft ruhiger als das Zentrum.'],
      ['Lohnt sich Marmaris für eine Woche?', 'Ja, weil Strand, Ausflüge und Marina-Atmosphäre in einer Woche gut kombinierbar sind.']
    ]
  },
  {
    file: 'tuerkei/alanya/index.html',
    destination: 'Alanya',
    whyTitle: 'Warum Alanya für DACH-Reisende?',
    whyText: 'Alanya funktioniert für DACH-Reisende besonders gut als preisbewusstes Sonnenziel mit starker Hotelauswahl. Die Region ist bekannt für lange Sandstrände, viele All-Inclusive-Hotels und eine Infrastruktur, die auf einfache Urlaubslogik ausgerichtet ist. Gerade für Familien oder Preis-Leistungs-orientierte Paare ist das attraktiv: Man bekommt oft viel Ausstattung, große Resortflächen und kalkulierbare Angebote, ohne in den teuersten Zonen der türkischen Riviera zu buchen. Gleichzeitig hat Alanya mehr Eigenprofil als viele reine Hotelcluster. Burg, Hafen, Kleopatra-Strand und die Küstenkulisse liefern genug Wiedererkennungswert, um nicht nur als austauschbares Pauschalziel wahrgenommen zu werden. Für DACH-Reisende ist zudem relevant, dass Alanya in Suchanfragen sehr häufig mit Preisen, Hotelqualität und Familienurlaub verbunden wird. Genau hier kann JBScore inhaltlich stark werden. Wer einfache Flug- und Paketlogik, viel Sonne und eine breite Auswahl an Hotels sucht, findet in Alanya oft schneller ein passendes Setup als in komplexeren Destinationen. Die Region ist deshalb nicht nur volumenstark, sondern auch conversion-nah.',
    tips: [
      'Kleopatra-Strand klingt stark, aber prüfe die tatsächliche Distanz vom Hotel zum Strandabschnitt.',
      'Sehr günstige Hotels immer auf Lage und Transferzeit abklopfen, nicht nur auf den Preis.',
      'Im Hochsommer schattige Poolbereiche und Zimmerklima wichtiger gewichten als dekorative Bilder.'
    ],
    extraFaq: [
      ['Ist Alanya günstiger als Antalya?', 'Oft ja, besonders bei All-Inclusive-Hotels und längeren Aufenthalten.'],
      ['Welche Hotels liegen nah am Kleopatra-Strand?', 'Das variiert, deshalb lohnt sich ein genauer Lagevergleich statt nur der Ortsangabe Alanya.'],
      ['Ist Alanya gut für Kinder?', 'Ja, vor allem wegen Strand, Resortangebot und guter Verfügbarkeit von Familienhotels.']
    ]
  },
  {
    file: 'spanien/barcelona/index.html',
    destination: 'Barcelona',
    whyTitle: 'Warum Barcelona für DACH-Reisende?',
    whyText: 'Barcelona ist für DACH-Reisende eines der effizientesten City-Ziele in Europa, weil Anreise, Orientierung und Erlebnisdichte außergewöhnlich gut zusammenpassen. Direkte Flugverbindungen, überschaubare Transferwege und eine sehr klare Stadtstruktur machen die Planung einfach. Gleichzeitig vereint Barcelona mehrere Reisearten: klassische Städtereise, Kulinarik, Strand, Kultur und Wochenendtrip. Für Deutschland, Österreich und die Schweiz ist das besonders relevant, weil kurze Aufenthalte hier tatsächlich funktionieren. Man muss keine langen Inlandswege oder komplizierte Transfers einkalkulieren, um viel zu sehen. Im Hotelvergleich ist Barcelona außerdem ein starkes SEO-Thema, weil die Frage nach dem richtigen Viertel entscheidend ist. Eixample, Barri Gòtic, El Born oder Barceloneta erzeugen sehr unterschiedliche Aufenthalte. Genau hier kann JetztBuchbar Mehrwert liefern: nicht nur schöne Bilder, sondern echte Entscheidungslogik nach Lage, Ruhe, Preis und Reisetyp. Für DACH-Reisende bleibt Barcelona deshalb nicht nur populär, sondern auch besonders klickstark, wenn die Inhalte konkret genug auf Wochenendtrip, Viertelwahl und Budgetsteuerung eingehen.',
    tips: [
      'Für ein Wochenende lieber zentrale Viertel priorisieren als ein minimal günstigeres Hotel weit außerhalb.',
      'Tickets für Sagrada Família und Park Güell immer vorab buchen, sonst verlierst du Reisezeit.',
      'Hotelwahl nach Viertel treffen: Eixample für Struktur, El Born für Bars, Barceloneta für Strandnähe.'
    ],
    extraFaq: [
      ['Ist Barcelona für Familien geeignet?', 'Ja, wenn Hotel und Viertel klug gewählt sind. Strand, Parks und kurze Wege helfen stark.'],
      ['Welches Viertel ist für Erstbesucher ideal?', 'Eixample oder das Gebiet zwischen Plaça Catalunya und El Born sind oft die sichersten Einstiegsoptionen.'],
      ['Lohnt sich Barcelona auch im Winter?', 'Ja, besonders für Städtereisen, weil das Klima mild bleibt und die Stadt weniger überlaufen ist.']
    ]
  },
  {
    file: 'spanien/mallorca/index.html',
    destination: 'Mallorca',
    whyTitle: 'Warum Mallorca für DACH-Reisende?',
    whyText: 'Mallorca bleibt für DACH-Reisende so relevant, weil kaum ein Mittelmeerziel in dieser Form Breite und Erreichbarkeit kombiniert. Es gibt zahllose Direktflüge, eine riesige Hotelvielfalt und sehr unterschiedliche Teilregionen, die für Familien, Paare, Aktivurlauber oder Kurzentschlossene funktionieren. Genau deshalb ist Mallorca SEO-seitig nicht nur ein generisches Ziel, sondern ein Cluster aus sehr vielen Suchintentionen: Strandhotel, Familienurlaub, Palma-Trip, ruhige Cala, Finca-Aufenthalt oder Luxusresort. Für Deutschland, Österreich und die Schweiz ist die Insel zudem emotional vertraut, aber gleichzeitig groß genug, um jedes Mal anders zu funktionieren. Wer zentraler wohnen will, schaut auf Palma und Umgebung. Wer Badefokus sucht, eher auf Alcudia, Cala Millor oder kleinere Buchten. Diese Entscheidungslogik ist genau der Punkt, an dem JetztBuchbar echten Mehrwert liefern kann. Mallorca ist damit kein triviales Ziel, sondern ein Markt, in dem gutes Clustering, bessere Titles und klare Hotelauswahl besonders stark wirken können.',
    tips: [
      'Nicht nur Palma oder Ballermann denken: Viele der stärksten Hotelzonen liegen in ruhigeren Cala- oder Familienregionen.',
      'Bei Kurztrips zählt Transferzeit stark, deshalb Lage zum Flughafen mitdenken.',
      'In Hochsaison Mietwagen früh sichern, wenn du Buchten und Bergdörfer flexibel erleben willst.'
    ],
    extraFaq: [
      ['Welche Region auf Mallorca ist für Familien am besten?', 'Alcudia, Playa de Muro und einige ruhigere Ostküstenorte sind oft besonders familienfreundlich.'],
      ['Ist Mallorca teuer?', 'Das hängt stark von Saison und Region ab. Außerhalb der Peak-Zeiten bleibt das Preisniveau oft gut steuerbar.'],
      ['Mallorca oder Kreta – was ist einfacher?', 'Mallorca ist meist einfacher in der Anreise und Logistik, Kreta oft vielfältiger bei Natur und Inselgefühl.']
    ]
  },
  {
    file: 'griechenland/kreta/index.html',
    destination: 'Kreta',
    whyTitle: 'Warum Kreta für DACH-Reisende?',
    whyText: 'Kreta ist für DACH-Reisende eine der stärksten Griechenland-Optionen, weil die Insel Größe, Vielfalt und Preis-Leistung auf selten ausgewogene Weise verbindet. Im Gegensatz zu kleineren Inseln bekommt man hier nicht nur Strand und Bilderbuchorte, sondern echte Auswahl: Chania, Heraklion, Rethymno, Berge, Schluchten, Familienstrände und ruhigere Küstenabschnitte. Genau diese Breite macht Kreta für organische Suche attraktiv, weil Nutzer nicht nur nach der Insel selbst suchen, sondern nach Regionen, Hoteltypen und Reiseformen. Für Reisende aus Deutschland, Österreich und der Schweiz ist außerdem wichtig, dass Kreta in vielen Budgets funktioniert. Es gibt Pauschalhotels, kleine Anlagen, Familienresorts und ruhigere Boutique-Optionen. Wer eine Griechenland-Reise mit etwas mehr Substanz sucht als nur einen Hotspot, bekommt auf Kreta oft das bessere Gesamtpaket. Dazu kommt die gute Eignung für Familien und Roadtrip-nahe Urlaubslogik: Man kann in einer Woche sehr unterschiedliche Erfahrungen sammeln. Genau diese Vielseitigkeit macht Kreta zu einer Prioritätsseite, die inhaltlich deutlich mehr Tiefe verdient.',
    tips: [
      'Nordküste ist logistisch oft einfacher, Südküste dafür wilder und ruhiger.',
      'Für Familien lieber flache Strandabschnitte statt nur Instagram-Spots priorisieren.',
      'Auf Kreta entscheidet die Region stark über das Urlaubserlebnis, nicht nur die Insel selbst.'
    ],
    extraFaq: [
      ['Ist Kreta besser für Familien oder Paare?', 'Beides funktioniert, aber viele Nordküstenregionen sind besonders familienfreundlich.'],
      ['Braucht man auf Kreta ein Auto?', 'Für reine Hotelaufenthalte nicht zwingend, für Strände und Inselvielfalt aber oft sehr sinnvoll.'],
      ['Welche Region auf Kreta ist am vielseitigsten?', 'Rund um Chania und Rethymno finden viele Reisende die beste Balance aus Stadt, Strand und Ausflügen.']
    ]
  },
  {
    file: 'griechenland/index.html',
    destination: 'Griechenland',
    whyTitle: 'Warum Griechenland für DACH-Reisende?',
    whyText: 'Griechenland ist für DACH-Reisende seit Jahren eines der stabilsten Ferienziele, weil Klima, Flugerreichbarkeit und Inselvielfalt sehr gut zusammenpassen. Von Deutschland, Österreich und der Schweiz sind viele Inseln direkt erreichbar, die Saison ist lang und die Urlaubsprofile unterscheiden sich stark genug, um verschiedene Zielgruppen abzuholen. Genau darin liegt der große Mehrwert: Griechenland ist nicht nur ein Ziel, sondern ein System aus Inseln und Regionen mit unterschiedlichen Antworten auf dieselbe Urlaubsfrage. Wer Familie sucht, schaut anders auf Kreta oder Rhodos. Wer Romantik sucht, landet eher bei Santorini. Wer Preis-Leistung will, prüft wiederum andere Inseln. Für SEO und Content heißt das: Eine starke Griechenland-Seite muss Orientierung liefern und nicht nur Sehnsuchtsbilder wiederholen. DACH-Reisende brauchen Klarheit darüber, welche Insel zu welchem Budget, welcher Saison und welchem Reisetyp passt. Wenn das sauber erklärt wird, ist Griechenland eines der dankbarsten Themen im Reisebereich, weil Suchvolumen, Kaufnähe und Markeninteresse gleichzeitig hoch sind.',
    tips: [
      'Nicht nur nach der schönsten Insel suchen, sondern nach der passendsten für Budget, Saison und Reisetyp.',
      'Randmonate Mai, Juni, September und Oktober liefern oft die beste Balance aus Wetter und Preis.',
      'Bei kleineren Inseln Flugtage und Transferlogik vorab prüfen, nicht erst nach der Hotelwahl.'
    ],
    extraFaq: [
      ['Welche griechische Insel passt zu Familien?', 'Kreta, Rhodos und Korfu sind für viele Familien die verlässlichsten Optionen.'],
      ['Ist Griechenland teuer?', 'Das hängt stark von Insel, Saison und Hoteltyp ab. Große Inseln bieten meist mehr Budgetflexibilität.'],
      ['Wann sollte man Griechenland buchen?', 'Für Sommerferien möglichst früh, für Randmonate gibt es oft noch gute Preisfenster.']
    ]
  },
  {
    file: 'tuerkei/index.html',
    destination: 'Türkei',
    whyTitle: 'Warum die Türkei für DACH-Reisende?',
    whyText: 'Die Türkei ist für DACH-Reisende ein so starkes Urlaubsziel, weil kaum ein anderes Sonnenland Flugverfügbarkeit, Resortdichte und Preis-Leistungs-Verhältnis in dieser Form kombiniert. Von Deutschland, Österreich und der Schweiz gibt es viele Direktverbindungen, dazu große Hotelmärkte in Antalya, Alanya, Bodrum oder Fethiye. Für organische Suche ist das entscheidend, weil sich hinter dem Oberbegriff Türkei sehr unterschiedliche Suchintentionen verbergen: Familienurlaub, Luxusresort, Badeziel, Aktivurlaub oder günstiges All Inclusive. Genau deshalb braucht eine starke Türkei-Seite klare Orientierung. Die Region Antalya funktioniert anders als Bodrum, Fethiye anders als Alanya. Wer diese Unterschiede sauber erklärt, hat einen echten inhaltlichen Vorteil gegenüber generischen Reiseportalen. Für DACH-Reisende ist die Türkei außerdem emotional und praktisch relevant: gutes Wetter, große Hotelanlagen, oft starke Kinderangebote und eine klare Buchungslogik. Wenn man dazu Sicherheit, Lage und echte Hoteldaten sauber einordnet, wird aus einem Massenmarkt ein differenzierbares SEO-Thema mit sehr konkretem Conversion-Potenzial.',
    tips: [
      'Nicht die Türkei als Ganzes buchen, sondern immer Region und Hotellage getrennt bewerten.',
      'All-Inclusive klingt ähnlich, unterscheidet sich aber stark nach Hotelqualität und Familienfokus.',
      'Randzeiten mit warmem Wetter und besseren Preisen sind oft Mai, Juni und Oktober.'
    ],
    extraFaq: [
      ['Welche Region in der Türkei ist für Familien am besten?', 'Antalya und Alanya sind wegen Resortdichte und Familienangebot meist die stärksten Kandidaten.'],
      ['Ist Bodrum besser für Paare?', 'Oft ja, wenn Marina, Ägäis-Flair und kleinere Hotelprofile wichtiger sind als große Resortanlagen.'],
      ['Wann ist die Türkei am günstigsten?', 'Außerhalb der Peak-Ferien, vor allem in den Randmonaten, sind viele Angebote attraktiver.']
    ]
  }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildWhyBlock(cfg) {
  return [
    '    <!-- SEO_DEEP_CONTENT_START -->',
    '    <div class="section">',
    '      <div class="container-narrow">',
    '        <h2 class="section-title">🧭 ' + cfg.whyTitle.replace(cfg.destination, '<span>' + cfg.destination + '</span>') + '</h2>',
    '        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:1.35rem 1.4rem;color:var(--text-soft);line-height:1.85;font-size:0.95rem">',
    '          <p>' + cfg.whyText + '</p>',
    '          <p>Für die Planung 2026 lohnt es sich, ' + cfg.destination + ' nicht nur nach Bildern oder Durchschnittspreisen zu bewerten. Entscheidend ist, wie gut Reisezeit, Hoteltyp und Lage zusammenpassen. Ein Strandhotel kann auf dem Papier stark aussehen, aber durch lange Transferzeiten, unruhige Abendzonen oder einen unpraktischen Zuschnitt für Familien im Alltag verlieren. Umgekehrt kann ein etwas teureres Hotel in besserer Lage die klar wirtschaftlichere Entscheidung sein, wenn Wege kürzer, Ausflüge einfacher und die Gesamtqualität stabiler sind. Genau deshalb ist es sinnvoll, schon vor der Buchung zu definieren, welche Art Reise wirklich geplant ist: Badeurlaub mit Kindern, Paarurlaub mit Ruhefokus, Stadt plus Strand oder flexible Ausflugstage. Wer diese Frage sauber beantwortet, findet in ' + cfg.destination + ' deutlich schneller das passende Hotelprofil.</p>',
    '          <p>Auch die Saisonalität wird oft unterschätzt. Viele Nutzer suchen nach dem schönsten Ort, obwohl der Unterschied in der Realität eher vom Reisemonat kommt. Ein Ziel kann im Hochsommer überfüllt, sehr heiß oder deutlich teurer sein, während dieselbe Destination in der Schulterzeit erheblich angenehmer funktioniert. Für DACH-Reisende zählt außerdem die Buchungslogik: Direktflugtage, Ferienfenster, Zimmerkategorie und Verpflegungsmodell haben einen spürbaren Einfluss auf den echten Endpreis. Wer ' + cfg.destination + ' sinnvoll vergleichen will, sollte deshalb immer Gesamtwert statt Einzelpreis betrachten. Das bedeutet: Lagequalität, Zielgruppenfit, Hotelgröße, Lärmprofil, Familienfokus und Ausflugsnutzen gemeinsam lesen. Genau an dieser Stelle wird ein strukturierter Vergleich wertvoller als bloße Inspirationsinhalte.</p>',
    '          <p>Im Wettbewerb mit großen Reiseportalen reicht es heute nicht mehr, nur allgemeine Tipps zu geben. Content muss Suchintentionen präzise beantworten: Welcher Teil von ' + cfg.destination + ' eignet sich für Familien, wo lohnt sich ein höheres Budget, welche Zonen sind eher für Paare geeignet und welche Hotels liefern bei ähnlichem Preis spürbar mehr Substanz? Wer diese Fragen klar beantwortet, verbessert nicht nur die Relevanz für Google, sondern auch die Klickwahrscheinlichkeit in den Suchergebnissen. Deshalb ist die Kombination aus erklärender Destination-Logik, statischer Top-Hotel-Vorschau, erweitertem FAQ und internen Links strategisch wichtig. So entsteht aus einer eher dünnen Übersichtsseite Schritt für Schritt eine belastbare Landingpage, die Orientierung gibt und echte Buchungsentscheidungen unterstützt.</p>',
    '          <p>Ein weiterer Punkt für 2026 ist die bessere Erwartungssteuerung. Viele Fehlbuchungen entstehen, weil Nutzer Destination und Hotel nicht als getrennte Entscheidung sehen. Eine starke Seite zu ' + cfg.destination + ' sollte deshalb nicht nur Lust machen, sondern auch filtern helfen: Welche Zone passt zu welchem Urlaubsziel, welche Aufenthaltsdauer lohnt sich, wann ist ein Resort sinnvoller als ein kleineres Hotel und welche Kompromisse sind akzeptabel? Sobald diese Fragen im Content sichtbar beantwortet werden, entsteht für Google und Nutzer ein klarerer thematischer Fit. Genau das stärkt langfristig Rankings, CTR und Conversion zugleich. Für JetztBuchbar ist dieser Ansatz besonders wertvoll, weil sich die Marke dadurch nicht über Masse, sondern über bessere Vorauswahl, transparentere Bewertung und praktischere Reiseentscheidung differenziert.</p>',
    '          <p>Gerade bei stark umkämpften Suchbegriffen hilft zusätzlicher Nutzwert auf Seitenebene: konkrete Vergleichshilfe statt bloßer Inspiration. Wenn Nutzer schon vor dem Klick erkennen, dass auf der Seite nicht nur allgemeine Reisetipps, sondern echte Hotel- und Regionenlogik hinterlegt ist, steigt die Chance auf qualifizierte Klicks deutlich. Für ' + cfg.destination + ' bedeutet das in der Praxis: klarere Einordnung nach Reisetyp, bessere Vorauswahl für Budget und Saison sowie belastbarere Unterschiede zwischen Stadtlage, Strandlage und Resortzonen. Genau diese Tiefe macht eine Seite relevanter, hilfreicher und langfristig konkurrenzfähiger.</p>',
    '        </div>',
    '      </div>',
    '    </div>',
    '',
    '    <div class="section-alt">',
    '      <div class="container-narrow">',
    '        <h2 class="section-title">🔎 Geheimtipps von <span>lokalen Experten</span></h2>',
    '        <div class="tips-grid">',
    cfg.tips.map((tip, index) => [
      '    <div class="tip-card">',
      '      <div class="tip-num">' + (index + 1) + '</div>',
      '      <div class="tip-text">' + tip + '</div>',
      '    </div>'
    ].join('\n')).join('\n'),
    '        </div>',
    '      </div>',
    '    </div>',
    '    <!-- SEO_DEEP_CONTENT_END -->'
  ].join('\n');
}

function findMatchingDivEnd(html, startIdx) {
  const tokenRe = /<div\b|<\/div>/g;
  tokenRe.lastIndex = startIdx;
  let depth = 0;
  let match;

  while ((match = tokenRe.exec(html))) {
    if (match[0] === '<div') {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return match.index;
    }
  }

  return -1;
}

function extendFaq(html, cfg) {
  const extraFaqHtml = cfg.extraFaq.map((item) => {
    return [
      '    <div class="faq-item">',
      '      <div class="faq-q">' + item[0] + '</div>',
      '      <div class="faq-a">' + item[1] + '</div>',
      '    </div>'
    ].join('\n');
  }).join('\n');

  html = html.replace(/\s*<!-- SEO_FAQ_EXPANSION_START -->[\s\S]*?<!-- SEO_FAQ_EXPANSION_END -->\s*/m, '\n');

  const listStart = html.indexOf('<div class="faq-list">');
  if (listStart === -1) return html;

  const listEnd = findMatchingDivEnd(html, listStart);
  if (listEnd === -1) return html;

  const insertAt = listEnd;
  const injection = '\n<!-- SEO_FAQ_EXPANSION_START -->\n' + extraFaqHtml + '\n<!-- SEO_FAQ_EXPANSION_END -->\n';
  return html.slice(0, insertAt) + injection + html.slice(insertAt);
}

function injectWhyBlock(html, cfg) {
  const block = buildWhyBlock(cfg);
  if (html.includes('SEO_DEEP_CONTENT_START')) {
    return html.replace(new RegExp('<!-- SEO_DEEP_CONTENT_START -->[\\s\\S]*?<!-- SEO_DEEP_CONTENT_END -->', 'm'), block);
  }

  const anchor = '<div class="section-alt">\n      <div class="container-narrow">\n        <h2 class="section-title">❓';
  const idx = html.indexOf(anchor);
  if (idx === -1) return html;
  return html.slice(0, idx) + block + '\n\n' + html.slice(idx);
}

function main() {
  let changed = 0;
  let skipped = 0;

  PAGES.forEach((cfg) => {
    const filePath = path.join(ROOT, cfg.file);
    if (!fs.existsSync(filePath)) {
      console.log('SKIP missing: ' + cfg.file);
      skipped++;
      return;
    }

    const original = fs.readFileSync(filePath, 'utf8');
    let updated = injectWhyBlock(original, cfg);
    updated = extendFaq(updated, cfg);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changed++;
      console.log('UPDATED ' + cfg.file);
    } else {
      skipped++;
      console.log('SKIP unchanged: ' + cfg.file);
    }
  });

  console.log('Done. changed=' + changed + ' skipped=' + skipped);
}

main();
