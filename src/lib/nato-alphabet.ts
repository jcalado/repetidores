export interface NATOLetter {
  letter: string;
  word: string;
  pronunciation: string;
}

export const NATO_ALPHABET: NATOLetter[] = [
  { letter: 'A', word: 'Alpha', pronunciation: 'AL-fah' },
  { letter: 'B', word: 'Bravo', pronunciation: 'BRAH-voh' },
  { letter: 'C', word: 'Charlie', pronunciation: 'CHAR-lee' },
  { letter: 'D', word: 'Delta', pronunciation: 'DELL-tah' },
  { letter: 'E', word: 'Echo', pronunciation: 'ECK-oh' },
  { letter: 'F', word: 'Foxtrot', pronunciation: 'FOKS-trot' },
  { letter: 'G', word: 'Golf', pronunciation: 'GOLF' },
  { letter: 'H', word: 'Hotel', pronunciation: 'hoh-TELL' },
  { letter: 'I', word: 'India', pronunciation: 'IN-dee-ah' },
  { letter: 'J', word: 'Juliet', pronunciation: 'JEW-lee-ett' },
  { letter: 'K', word: 'Kilo', pronunciation: 'KEY-loh' },
  { letter: 'L', word: 'Lima', pronunciation: 'LEE-mah' },
  { letter: 'M', word: 'Mike', pronunciation: 'MIKE' },
  { letter: 'N', word: 'November', pronunciation: 'no-VEM-ber' },
  { letter: 'O', word: 'Oscar', pronunciation: 'OSS-cah' },
  { letter: 'P', word: 'Papa', pronunciation: 'pah-PAH' },
  { letter: 'Q', word: 'Quebec', pronunciation: 'keh-BECK' },
  { letter: 'R', word: 'Romeo', pronunciation: 'ROW-me-oh' },
  { letter: 'S', word: 'Sierra', pronunciation: 'see-AIR-rah' },
  { letter: 'T', word: 'Tango', pronunciation: 'TANG-go' },
  { letter: 'U', word: 'Uniform', pronunciation: 'YOU-nee-form' },
  { letter: 'V', word: 'Victor', pronunciation: 'VIK-tah' },
  { letter: 'W', word: 'Whiskey', pronunciation: 'WISS-key' },
  { letter: 'X', word: 'X-ray', pronunciation: 'ECKS-ray' },
  { letter: 'Y', word: 'Yankee', pronunciation: 'YANG-key' },
  { letter: 'Z', word: 'Zulu', pronunciation: 'ZOO-loo' },
];

export const NATO_NUMBERS: NATOLetter[] = [
  { letter: '0', word: 'Zero', pronunciation: 'ZEE-ro' },
  { letter: '1', word: 'One', pronunciation: 'WUN' },
  { letter: '2', word: 'Two', pronunciation: 'TOO' },
  { letter: '3', word: 'Three', pronunciation: 'TREE' },
  { letter: '4', word: 'Four', pronunciation: 'FOW-er' },
  { letter: '5', word: 'Five', pronunciation: 'FIFE' },
  { letter: '6', word: 'Six', pronunciation: 'SIX' },
  { letter: '7', word: 'Seven', pronunciation: 'SEV-en' },
  { letter: '8', word: 'Eight', pronunciation: 'AIT' },
  { letter: '9', word: 'Nine', pronunciation: 'NIN-er' },
];

export function getNATOWord(char: string): NATOLetter | undefined {
  const upper = char.toUpperCase();
  return (
    NATO_ALPHABET.find((n) => n.letter === upper) ||
    NATO_NUMBERS.find((n) => n.letter === char)
  );
}
