import { BusOperator, BusStop } from '../types/bus';

export const SINGAPORE_BUS_STOPS: BusStop[] = [
  // Central & Orchard
  {
    code: '09048',
    description: 'Lucky Plaza',
    roadName: 'Orchard Rd',
    region: 'Central & Orchard',
    services: ['7', '14', '16', '65', '106', '111', '123', '175', '502'],
  },
  {
    code: '09022',
    description: 'Orchard Stn / Tang Plaza',
    roadName: 'Orchard Rd',
    region: 'Central & Orchard',
    services: ['36', '77', '124', '143', '167', '174', '190', '972'],
  },
  {
    code: '08138',
    description: 'Somerset Stn',
    roadName: 'Orchard Rd',
    region: 'Central & Orchard',
    services: ['7', '14', '16', '36', '65', '77', '111', '123', '143', '175'],
  },
  {
    code: '08057',
    description: 'Dhoby Ghaut Stn',
    roadName: 'Orchard Rd',
    region: 'Central & Orchard',
    services: ['7', '14', '16', '36', '64', '65', '106', '111', '139', '162'],
  },
  {
    code: '01012',
    description: 'Hotel Grand Pacific',
    roadName: 'Victoria St',
    region: 'Central & Orchard',
    services: ['2', '7', '12', '32', '33', '51', '61', '63', '80', '130', '133', '145', '175', '197'],
  },
  {
    code: '01113',
    description: 'Bugis Stn Exit A',
    roadName: 'Victoria St',
    region: 'Central & Orchard',
    services: ['2', '7', '12', '32', '33', '51', '61', '63', '80', '130', '133', '175'],
  },
  {
    code: '04121',
    description: 'Stamford Court / SMU',
    roadName: 'Stamford Rd',
    region: 'Central & Orchard',
    services: ['7', '14', '16', '36', '77', '106', '111', '124', '131', '147', '166', '167', '175', '190', '857'],
  },
  {
    code: '04167',
    description: 'City Hall Stn Exit B',
    roadName: 'North Bridge Rd',
    region: 'Central & Orchard',
    services: ['32', '51', '61', '63', '80', '124', '145', '166', '174', '197', '851'],
  },
  {
    code: '05022',
    description: 'Chinatown Stn Exit C',
    roadName: 'Eu Tong Sen St',
    region: 'Central & Orchard',
    services: ['2', '12', '33', '54', '63', '124', '143', '147', '190', '851', '961'],
  },
  {
    code: '50038',
    description: 'Novena Stn',
    roadName: 'Thomson Rd',
    region: 'Central & Orchard',
    services: ['21', '56', '57', '131', '141', '166', '851', '980'],
  },

  // Marina & CBD
  {
    code: '03509',
    description: 'Marina Bay Sands Theatre',
    roadName: 'Bayfront Ave',
    region: 'Marina & CBD',
    services: ['97', '106', '133', '502', '518'],
  },
  {
    code: '03218',
    description: 'One Raffles Quay',
    roadName: 'Raffles Quay',
    region: 'Marina & CBD',
    services: ['10', '57', '70', '100', '107', '130', '131', '162', '196', '400'],
  },
  {
    code: '03019',
    description: 'OUE Bayfront',
    roadName: 'Collyer Quay',
    region: 'Marina & CBD',
    services: ['10', '57', '70', '100', '107', '130', '131', '162', '196'],
  },
  {
    code: '03222',
    description: 'Shenton Way Stn',
    roadName: 'Shenton Way',
    region: 'Marina & CBD',
    services: ['10', '57', '70', '97', '106', '133', '186', '400', '970'],
  },
  {
    code: '05419',
    description: 'Tanjong Pagar Stn Exit C',
    roadName: 'Anson Rd',
    region: 'Marina & CBD',
    services: ['57', '80', '131', '145', '400', '560'],
  },
  {
    code: '02151',
    description: 'Suntec Convention Ctr',
    roadName: 'Temasek Blvd',
    region: 'Marina & CBD',
    services: ['36', '70M', '97', '106', '111', '133', '162M', '502', '518', '857'],
  },
  {
    code: '14141',
    description: 'VivoCity',
    roadName: 'Telok Blangah Rd',
    region: 'Marina & CBD',
    services: ['10', '30', '57', '61', '65', '80', '97', '100', '131', '143', '145', '166', '855'],
  },

  // East
  {
    code: '75009',
    description: 'Tampines Int',
    roadName: 'Tampines Central 1',
    region: 'East',
    services: ['3', '4', '8', '10', '19', '20', '22', '23', '28', '31', '65', '69', '72', '127'],
  },
  {
    code: '84009',
    description: 'Bedok Int',
    roadName: 'Bedok North Dr',
    region: 'East',
    services: ['7', '9', '14', '16', '18', '25', '26', '30', '32', '35', '40', '66', '222', '225G'],
  },
  {
    code: '77009',
    description: 'Pasir Ris Int',
    roadName: 'Pasir Ris Central',
    region: 'East',
    services: ['3', '5', '6', '12', '15', '17', '21', '58', '88', '354', '358', '359'],
  },
  {
    code: '81111',
    description: 'Paya Lebar Stn Exit B',
    roadName: 'Paya Lebar Rd',
    region: 'East',
    services: ['24', '28', '43', '70', '76', '135', '154', '155'],
  },
  {
    code: '95109',
    description: 'Changi Airport PTB1',
    roadName: 'Airport Blvd',
    region: 'East',
    services: ['24', '27', '34', '36', '53', '110', '858'],
  },
  {
    code: '92049',
    description: 'Parkway Parade',
    roadName: 'Marine Parade Rd',
    region: 'East',
    services: ['15', '31', '36', '43', '48', '135', '196', '197', '966'],
  },

  // West
  {
    code: '28009',
    description: 'Jurong East Int',
    roadName: 'Jurong Gateway Rd',
    region: 'West',
    services: ['51', '52', '66', '78', '79', '97', '98', '105', '143', '160', '183', '197', '333', '334'],
  },
  {
    code: '17009',
    description: 'Clementi Int',
    roadName: 'Clementi Ave 3',
    region: 'West',
    services: ['7', '14', '96', '156', '165', '166', '175', '282', '284', '285'],
  },
  {
    code: '22009',
    description: 'Boon Lay Int',
    roadName: 'Jurong West Central 3',
    region: 'West',
    services: ['30', '79', '154', '157', '172', '174', '178', '179', '180', '199', '240', '242'],
  },
  {
    code: '44009',
    description: 'Choa Chu Kang Int',
    roadName: 'Choa Chu Kang Loop',
    region: 'West',
    services: ['67', '172', '188', '190', '300', '301', '302', '307', '925', '927', '975', '983'],
  },
  {
    code: '43009',
    description: 'Bukit Batok Int',
    roadName: 'Bukit Batok Central',
    region: 'West',
    services: ['61', '77', '106', '173', '177', '189', '852', '941', '945', '947'],
  },
  {
    code: '19039',
    description: 'Kent Ridge Stn',
    roadName: 'South Buona Vista Rd',
    region: 'West',
    services: ['95', '200'],
  },

  // North
  {
    code: '46009',
    description: 'Woodlands Int',
    roadName: 'Woodlands Sq',
    region: 'North',
    services: ['161', '168', '169', '178', '187', '856', '858', '900', '901', '903', '911', '912', '913', '960'],
  },
  {
    code: '59009',
    description: 'Yishun Int',
    roadName: 'Yishun Central 1',
    region: 'North',
    services: ['39', '85', '103', '171', '800', '804', '806', '807', '811', '812', '851', '852', '858'],
  },
  {
    code: '54009',
    description: 'Ang Mo Kio Int',
    roadName: 'Ang Mo Kio Ave 8',
    region: 'North',
    services: ['22', '24', '25', '73', '86', '130', '133', '135', '136', '138', '166', '169', '261', '262'],
  },
  {
    code: '53231',
    description: 'Bishan Stn',
    roadName: 'Bishan Rd',
    region: 'North',
    services: ['13', '52', '54', '56', '58', '59', '88', '156', '410G'],
  },
  {
    code: '52009',
    description: 'Toa Payoh Int',
    roadName: 'Toa Payoh Central',
    region: 'North',
    services: ['8', '26', '28', '31', '57', '59', '73', '88', '90', '141', '142', '157', '231', '232', '235', '238'],
  },

  // North-East
  {
    code: '66009',
    description: 'Serangoon Int',
    roadName: 'Serangoon Central',
    region: 'North-East',
    services: ['100', '101', '103', '105', '109', '158', '315', '317'],
  },
  {
    code: '64009',
    description: 'Hougang Central Int',
    roadName: 'Hougang Central',
    region: 'North-East',
    services: ['51', '74', '102', '112', '113', '116', '147', '151', '153', '165', '325'],
  },
  {
    code: '67009',
    description: 'Sengkang Int',
    roadName: 'Sengkang Sq',
    region: 'North-East',
    services: ['80', '83', '86', '87', '156', '159', '163', '371', '372', '374'],
  },
  {
    code: '65009',
    description: 'Punggol Int',
    roadName: 'Punggol Pl',
    region: 'North-East',
    services: ['3', '34', '43', '62', '82', '83', '84G', '136', '381', '382G', '386'],
  },
];

export const OPERATOR_LABELS: Record<BusOperator, string> = {
  SBST: 'SBS Transit',
  SMRT: 'SMRT Buses',
  TTS: 'Tower Transit',
  GAS: 'Go-Ahead SG',
};

export function inferOperatorForService(serviceNo: string): BusOperator {
  const num = parseInt(serviceNo.replace(/\D/g, ''), 10);
  if (Number.isNaN(num)) return 'SBST';
  if ([61, 67, 77, 106, 171, 172, 173, 177, 178, 180, 187, 188, 189, 190, 851, 852, 855, 856, 857, 858, 900, 901, 903, 911, 912, 913, 925, 927, 941, 945, 947, 960, 961, 966, 970, 972, 975, 980, 983].includes(num)) {
    return 'SMRT';
  }
  if ([66, 78, 79, 97, 98, 105, 143, 173, 183, 282, 284, 285, 333, 334, 856, 858].includes(num)) {
    return 'TTS';
  }
  if ([3, 6, 12, 15, 17, 34, 43, 62, 82, 83, 84, 118, 119, 354, 358, 359, 381, 382, 386].includes(num)) {
    return 'GAS';
  }
  return 'SBST';
}
