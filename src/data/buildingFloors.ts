// Sample building floor data: 1st to 10th floor
// Each floor has sample rooms with room number, BHK, facing, and total facing

export interface RoomData {
  roomNumber: string;
  bhk: number;
  facing: string;
  size: number;
  totalFacing: number;
}

export interface FloorData {
  floor: string;
  rooms: RoomData[];
}

export const buildingFloors: FloorData[] = [
  {
    floor: '1st Floor',
    rooms: [
      { roomNumber: '101', bhk: 2, facing: 'East',size:1200 ,totalFacing: 1 },
      { roomNumber: '102', bhk: 3, facing: 'West',size:1200 ,totalFacing: 2 },
      { roomNumber: '103', bhk: 1, facing: 'North',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '2nd Floor',
    rooms: [
      { roomNumber: '201', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '202', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '203', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '3rd Floor',
    rooms: [
      { roomNumber: '301', bhk: 2, facing: 'North',size:1200 ,totalFacing: 1 },
      { roomNumber: '302', bhk: 3, facing: 'South',size:1200 ,totalFacing: 2 },
      { roomNumber: '303', bhk: 1, facing: 'East',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '4th Floor',
    rooms: [
      { roomNumber: '401', bhk: 2, facing: 'West',size:1200 ,totalFacing: 1 },
      { roomNumber: '402', bhk: 3, facing: 'North',size:1200 ,totalFacing: 2 },
      { roomNumber: '403', bhk: 1, facing: 'South',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '5th Floor',
    rooms: [
      { roomNumber: '501', bhk: 2, facing: 'East',size:1200 ,totalFacing: 1 },
      { roomNumber: '502', bhk: 3, facing: 'West',size:1200 ,totalFacing: 2 },
      { roomNumber: '503', bhk: 1, facing: 'North',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '6th Floor',
    rooms: [
      { roomNumber: '601', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '602', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '603', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
      { roomNumber: '601', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '602', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '603', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
      { roomNumber: '601', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '602', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '603', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
      { roomNumber: '601', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '602', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '603', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '7th Floor',
    rooms: [
      { roomNumber: '701', bhk: 2, facing: 'North',size:1200 ,totalFacing: 1 },
      { roomNumber: '702', bhk: 3, facing: 'South',size:1200 ,totalFacing: 2 },
      { roomNumber: '703', bhk: 1, facing: 'East',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '8th Floor',
    rooms: [
      { roomNumber: '801', bhk: 2, facing: 'West',size:1200 ,totalFacing: 1 },
      { roomNumber: '802', bhk: 3, facing: 'North',size:1200 ,totalFacing: 2 },
      { roomNumber: '803', bhk: 1, facing: 'South',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '9th Floor',
    rooms: [
      { roomNumber: '901', bhk: 2, facing: 'East',size:1200 ,totalFacing: 1 },
      { roomNumber: '902', bhk: 3, facing: 'West',size:1200 ,totalFacing: 2 },
      { roomNumber: '903', bhk: 1, facing: 'North',size:1200 ,totalFacing: 1 },
    ],
  },
  {
    floor: '10th Floor',
    rooms: [
      { roomNumber: '1001', bhk: 2, facing: 'South',size:1200 ,totalFacing: 1 },
      { roomNumber: '1002', bhk: 3, facing: 'East',size:1200 ,totalFacing: 2 },
      { roomNumber: '1003', bhk: 1, facing: 'West',size:1200 ,totalFacing: 1 },
    ],
  },
  
];
