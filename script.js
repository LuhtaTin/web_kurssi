'use strict';

const tallennus = {
  lue(avain) {
    try {
      return localStorage.getItem(avain);
    } catch {
      return null;
    }
  },
  kirjoita(avain, arvo) {
    try {
      localStorage.setItem(avain, arvo);
    } catch {

    }
  }
};

// Asetukset-popover
const valikko = document.getElementById('asetukset-valikko');
const tekstiNappi = document.getElementById('teksti-nappi');

if (valikko && tekstiNappi) {
  const asetaIsoTeksti = (paalla) => {
    document.documentElement.classList.toggle('iso-teksti', paalla);
    tekstiNappi.setAttribute('aria-pressed', String(paalla));
  };

  asetaIsoTeksti(tallennus.lue('pohjanpiha-iso-teksti') === '1');

  tekstiNappi.addEventListener('click', () => {
    const paalla = tekstiNappi.getAttribute('aria-pressed') !== 'true';
    asetaIsoTeksti(paalla);
    tallennus.kirjoita('pohjanpiha-iso-teksti', paalla ? '1' : '0');
  });

  valikko.addEventListener('toggle', (tapahtuma) => {
    if (tapahtuma.newState === 'open') {
      tekstiNappi.focus();
    }
  });
}

// Esiintyjälista haku, päiväsuodatus, lajittelu
const lista = document.getElementById('esiintyjat');

if (lista) {
  const kohteet = [...lista.children];
  const haku = document.getElementById('haku');
  const tila = document.getElementById('tila');
  const tyokalut = document.getElementById('tyokalut');
  const paivaNapit = [...document.querySelectorAll('[data-suodata-paiva]')];
  const jarjestysNapit = [...document.querySelectorAll('[data-jarjesta]')];

  const paivaNimet = { kaikki: 'kaikki päivät', 1: 'päivä 1', 2: 'päivä 2' };
  const jarjestysNimet = { aika: 'esiintymisajan mukaan', nimi: 'nimen mukaan' };

  let paiva = 'kaikki';
  let jarjestys = 'aika';

  const paivita = () => {
    const hakusana = haku.value.trim();
    const pienella = hakusana.toLowerCase();

    const jarjestetyt = [...kohteet].sort((a, b) => {
      if (jarjestys === 'nimi') {
        return a.dataset.nimi.localeCompare(b.dataset.nimi, 'fi');
      }
      return (
        Number(a.dataset.paiva) - Number(b.dataset.paiva) ||
        a.dataset.aika.localeCompare(b.dataset.aika)
      );
    });
    jarjestetyt.forEach((kohde) => lista.append(kohde));

    let nakyvia = 0;
    for (const kohde of kohteet) {
      const paivaSopii = paiva === 'kaikki' || kohde.dataset.paiva === paiva;
      const hakuSopii = !pienella || kohde.textContent.toLowerCase().includes(pienella);
      kohde.hidden = !(paivaSopii && hakuSopii);
      if (!kohde.hidden) nakyvia += 1;
    }

    paivaNapit.forEach((nappi) => {
      nappi.setAttribute('aria-pressed', String(nappi.dataset.suodataPaiva === paiva));
    });
    jarjestysNapit.forEach((nappi) => {
      nappi.setAttribute('aria-pressed', String(nappi.dataset.jarjesta === jarjestys));
    });

    const sana = nakyvia === 1 ? 'esiintyjä' : 'esiintyjää';
    tila.textContent =
      `Näytetään ${nakyvia} ${sana} ${kohteet.length}:sta. ` +
      `Päivä: ${paivaNimet[paiva]}. ` +
      `Haku: ${hakusana ? `"${hakusana}"` : 'ei hakua'}. ` +
      `Järjestys: ${jarjestysNimet[jarjestys]}.`;
  };

  paivaNapit.forEach((nappi) => {
    nappi.addEventListener('click', () => {
      paiva = nappi.dataset.suodataPaiva;
      paivita();
    });
  });

  jarjestysNapit.forEach((nappi) => {
    nappi.addEventListener('click', () => {
      jarjestys = nappi.dataset.jarjesta;
      paivita();
    });
  });

  haku.addEventListener('input', paivita);


  tyokalut.hidden = false;
  paivita();
}

// Yhteydenottolomake
const lomake = document.getElementById('yhteydenotto');

if (lomake) {
  const valmis = document.getElementById('valmis');
  const kentat = [...lomake.querySelectorAll('input, textarea')];

  const virheteksti = (kentta) => {
    if (!kentta.value.trim()) {
      return {
        name: 'Kirjoita nimesi.',
        email: 'Kirjoita sähköpostiosoitteesi.',
        message: 'Kirjoita viesti.'
      }[kentta.name];
    }
    if (kentta.type === 'email' && kentta.validity.typeMismatch) {
      return 'Sähköpostiosoite ei näytä oikealta. Kokeile muotoa nimi@esimerkki.fi.';
    }
    return '';
  };

  const asetaVirhe = (kentta, teksti) => {
    const virheElementti = document.getElementById(`${kentta.id}-virhe`);
    virheElementti.textContent = teksti ? `Virhe: ${teksti}` : '';
    if (teksti) {
      kentta.setAttribute('aria-invalid', 'true');
    } else {
      kentta.removeAttribute('aria-invalid');
    }
  };

  lomake.addEventListener('submit', (tapahtuma) => {
    tapahtuma.preventDefault();
    valmis.textContent = '';

    let ensimmainenVirhe = null;
    for (const kentta of kentat) {
      const teksti = virheteksti(kentta);
      asetaVirhe(kentta, teksti);
      if (teksti && !ensimmainenVirhe) ensimmainenVirhe = kentta;
    }

    if (ensimmainenVirhe) {
      ensimmainenVirhe.focus();
      return;
    }

    tallennus.kirjoita(
      'pohjanpiha-pyynto',
      JSON.stringify({
        nimi: lomake.elements.name.value.trim(),
        sahkoposti: lomake.elements.email.value.trim(),
        viesti: lomake.elements.message.value.trim(),
        aika: new Date().toISOString()
      })
    );
    lomake.reset();
    valmis.textContent =
      'Pyyntö on valmis. Se on tallennettu tähän selaimeen, mutta sivusto ei vielä lähetä sitä järjestäjille.';
  });

  kentat.forEach((kentta) => {
    kentta.addEventListener('input', () => {
      if (kentta.hasAttribute('aria-invalid')) {
        asetaVirhe(kentta, virheteksti(kentta));
      }
    });
  });
}