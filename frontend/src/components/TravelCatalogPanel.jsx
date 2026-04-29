import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  Car,
  Clock3,
  ExternalLink,
  Home,
  Hotel,
  MapPinned,
  Palmtree,
  Plane,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Train,
} from "lucide-react";

const CATEGORY_META = {
  Flights: {
    eyebrow: "Route flights",
    title: (source, destination) => `Flights from ${source} to ${destination}`,
    description: (source, destination) =>
      `Compare practical flight options for the ${source} to ${destination} route.`,
    action: "View flight",
    icon: Plane,
    countLabel: "flight options",
  },
  Hotels: {
    eyebrow: "Places to stay",
    title: (_, destination) => `Stays in ${destination}`,
    description: (_, destination) =>
      `Browse hotel-style listings in ${destination} with area, rating, cancellation and meal details.`,
    action: "View stay",
    icon: Hotel,
    countLabel: "stay options",
  },
  Homes: {
    eyebrow: "Homes and apartments",
    title: (_, destination) => `Homes in ${destination}`,
    description: (_, destination) =>
      `Private stays, serviced apartments and longer-stay options in ${destination}.`,
    action: "View home",
    icon: Home,
    countLabel: "home options",
  },
  Packages: {
    eyebrow: "Holiday packages",
    title: (_, destination) => `Packages for ${destination}`,
    description: (source, destination) =>
      `Bundle-style ideas for travellers going from ${source} to ${destination}.`,
    action: "Explore package",
    icon: Palmtree,
    countLabel: "package options",
  },
  Trains: {
    eyebrow: "Rail options",
    title: (source, destination) => `Trains from ${source} to ${destination}`,
    description: (source, destination) =>
      `Rail-style journey options for the ${source} to ${destination} route.`,
    action: "Check route",
    icon: Train,
    countLabel: "rail options",
  },
  Buses: {
    eyebrow: "Bus options",
    title: (source, destination) => `Buses from ${source} to ${destination}`,
    description: (source, destination) =>
      `Road travel options and bus-style listings for ${source} to ${destination}.`,
    action: "Check bus",
    icon: Bus,
    countLabel: "bus options",
  },
  Cabs: {
    eyebrow: "Cab routes",
    title: (source, destination) => `Cabs from ${source} to ${destination}`,
    description: (source, destination) =>
      `Private ride and transfer-style options for ${source} to ${destination}.`,
    action: "View route",
    icon: Car,
    countLabel: "cab options",
  },
  Tours: {
    eyebrow: "Things to do",
    title: (_, destination) => `Experiences in ${destination}`,
    description: (_, destination) =>
      `Destination-led activities and local experiences in ${destination}.`,
    action: "View experience",
    icon: MapPinned,
    countLabel: "experience options",
  },
  Insurance: {
    eyebrow: "Travel cover",
    title: (_, destination) => `Travel cover for ${destination}`,
    description: (_, destination) =>
      `Protection-style plans for trips connected to ${destination}.`,
    action: "View cover",
    icon: Shield,
    countLabel: "cover options",
  },
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90";

const UNIVERSAL_TRAVEL_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=1400&q=90",
];

const CITY_IMAGE_LIBRARY = {
  Bengaluru: [
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1526481280695-3c4691d1f8f1?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=90",
  ],
  Kolkata: [
    "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1571679654681-ba01b9e1e117?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=90",
  ],
  Mumbai: [
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=90",
  ],
  Delhi: [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1612257999760-83f8f87f2f2b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=90",
  ],
  Goa: [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
  ],
  Chennai: [
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
  ],
  Default: [...UNIVERSAL_TRAVEL_IMAGES],
};

const CATEGORY_IMAGE_LIBRARY = {
  Flights: [
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1544015759-91f32f7b3b7a?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1483450388369-9ed95738483c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&w=1400&q=90",
  ],
  Hotels: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1551776235-dde6d4829808?auto=format&fit=crop&w=1400&q=90",
  ],
  Homes: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90&sat=-10",
  ],
  Packages: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=90",
  ],
  Trains: [
    "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1515165562835-c4c1b19b825e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1518632614182-8dbb8e7d5f06?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1499096382193-ebb232527fee?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1517394834181-95ed159986c7?auto=format&fit=crop&w=1400&q=90",
  ],
  Buses: [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=90&sat=-20",
  ],
  Cabs: [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=1400&q=90",
  ],
  Tours: [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=90",
  ],
  Insurance: [
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1553729784-e91953dec042?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1400&q=90",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=90",
  ],
};

const CITY_AREAS = {
  Bengaluru: [
    "MG Road",
    "Indiranagar",
    "Koramangala",
    "Whitefield",
    "Electronic City",
    "Hebbal",
    "Airport Road",
    "UB City",
  ],
  Kolkata: [
    "Park Street",
    "Esplanade",
    "Salt Lake",
    "New Town",
    "Howrah",
    "Ballygunge",
    "EM Bypass",
    "Airport Gate",
  ],
  Mumbai: [
    "Bandra",
    "Andheri",
    "Powai",
    "Lower Parel",
    "BKC",
    "Juhu",
    "Colaba",
    "Airport Zone",
  ],
  Delhi: [
    "Connaught Place",
    "Aerocity",
    "Saket",
    "Karol Bagh",
    "Dwarka",
    "South Delhi",
    "Paharganj",
    "Noida Border",
  ],
  Goa: [
    "Calangute",
    "Baga",
    "Candolim",
    "Panjim",
    "Anjuna",
    "Vagator",
    "Colva",
    "Morjim",
  ],
  Chennai: [
    "T Nagar",
    "Nungambakkam",
    "OMR",
    "Adyar",
    "Egmore",
    "Airport Road",
    "Mylapore",
    "Anna Nagar",
  ],
};

const HOTEL_PATTERNS = [
  "4-star hotel near",
  "Business hotel in",
  "Couple-friendly stay in",
  "Airport hotel near",
  "Premium stay in",
  "City centre hotel in",
  "Family hotel in",
  "Modern rooms in",
];

const HOME_PATTERNS = [
  "Serviced apartment in",
  "Studio stay in",
  "Private home in",
  "Long-stay apartment in",
  "Family apartment in",
  "Work-friendly stay in",
  "Compact home in",
  "Premium villa in",
];

const PACKAGE_PATTERNS = [
  "3N/4D city package",
  "Weekend break package",
  "Stay + sightseeing package",
  "Couple getaway package",
  "Family city package",
  "Flexible comfort package",
  "Culture and food package",
  "Premium short escape",
];

const TOUR_PATTERNS = [
  "City highlights tour",
  "Food walk experience",
  "Half-day local trail",
  "Heritage walk",
  "Evening city experience",
  "Shopping and cafe trail",
  "Photography route",
  "Weekend exploration tour",
];

const INSURANCE_PATTERNS = [
  "Essential travel cover",
  "Medical emergency cover",
  "Trip delay cover",
  "Baggage protection cover",
  "Flexible cancellation cover",
  "Family travel cover",
  "Premium travel shield",
  "International support cover",
];

const FLIGHT_PATTERNS = [
  { title: "Morning nonstop option", duration: "2h 35m", time: "06:10 → 08:45" },
  { title: "Late morning nonstop option", duration: "2h 45m", time: "10:20 → 13:05" },
  { title: "Afternoon flexible fare", duration: "2h 40m", time: "14:15 → 16:55" },
  { title: "Evening nonstop option", duration: "2h 50m", time: "18:40 → 21:30" },
  { title: "Business-hour departure", duration: "2h 35m", time: "08:30 → 11:05" },
  { title: "Value timing option", duration: "2h 45m", time: "12:50 → 15:35" },
  { title: "Flexible evening fare", duration: "2h 50m", time: "17:10 → 20:00" },
  { title: "Night departure option", duration: "2h 40m", time: "20:45 → 23:25" },
];

const TRAIN_PATTERNS = [
  { title: "Day rail option", duration: "6h 10m", time: "07:10 → 13:20" },
  { title: "Morning express option", duration: "5h 55m", time: "06:25 → 12:20" },
  { title: "AC chair car route", duration: "6h 25m", time: "09:15 → 15:40" },
  { title: "Evening rail option", duration: "6h 40m", time: "16:20 → 23:00" },
  { title: "Overnight rail style", duration: "8h 15m", time: "22:10 → 06:25" },
  { title: "Fastest available rail", duration: "5h 45m", time: "05:55 → 11:40" },
  { title: "Late afternoon train", duration: "6h 05m", time: "15:00 → 21:05" },
  { title: "Flexible rail option", duration: "6h 35m", time: "11:30 → 18:05" },
];

const BUS_PATTERNS = [
  { title: "AC sleeper option", duration: "8h 20m", time: "22:00 → 06:20" },
  { title: "Volvo seater option", duration: "7h 50m", time: "23:15 → 07:05" },
  { title: "Night coach option", duration: "8h 05m", time: "21:45 → 05:50" },
  { title: "Semi-sleeper route", duration: "8h 40m", time: "20:30 → 05:10" },
  { title: "Premium coach option", duration: "7h 45m", time: "22:40 → 06:25" },
  { title: "Budget overnight option", duration: "8h 30m", time: "21:15 → 05:45" },
  { title: "Late boarding option", duration: "8h 10m", time: "23:00 → 07:10" },
  { title: "Flexible night route", duration: "8h 25m", time: "20:50 → 05:15" },
];

const CAB_PATTERNS = [
  "Private sedan transfer",
  "SUV route option",
  "Airport pickup transfer",
  "Outstation one-way ride",
  "Round-trip road option",
  "Comfort cab booking",
  "Family ride option",
  "Flexible stopover cab",
];

function normalizeCity(value) {
  const clean = String(value || "").trim();
  if (!clean) return "Destination";

  const lower = clean.toLowerCase();
  if (["bangalore", "bengaluru", "blr"].includes(lower)) return "Bengaluru";
  if (lower === "bombay") return "Mumbai";
  if (lower === "calcutta") return "Kolkata";
  if (lower === "madras") return "Chennai";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function resolveCategory(raw) {
  const clean = String(raw || "").trim().toLowerCase();

  if (!clean) return "Hotels";
  if (["flight", "flights", "route flights"].includes(clean)) return "Flights";
  if (["hotel", "hotels", "stays", "places to stay", "destination stays"].includes(clean)) return "Hotels";
  if (["home", "homes", "apartments"].includes(clean)) return "Homes";
  if (["package", "packages", "holiday packages"].includes(clean)) return "Packages";
  if (["train", "trains", "rail", "rail options"].includes(clean)) return "Trains";
  if (["bus", "buses", "bus options"].includes(clean)) return "Buses";
  if (["cab", "cabs", "cab routes"].includes(clean)) return "Cabs";
  if (["tour", "tours", "things to do", "experiences"].includes(clean)) return "Tours";
  if (["insurance", "travel cover", "cover"].includes(clean)) return "Insurance";

  return "Hotels";
}


const INDIA_CITY_NAMES = new Set([
  "kolkata",
  "calcutta",
  "bengaluru",
  "bangalore",
  "chennai",
  "delhi",
  "new delhi",
  "mumbai",
  "bombay",
  "hyderabad",
  "goa",
  "pune",
  "jaipur",
]);

const INDIA_ONLY_TRANSPORT_CATEGORIES = new Set(["Trains", "Buses", "Cabs"]);

function normalizeCityKey(city) {
  return String(city || "").trim().toLowerCase();
}

function isIndiaCity(city) {
  return INDIA_CITY_NAMES.has(normalizeCityKey(city));
}

function isDomesticIndiaRoute(sourceCity, destinationCity) {
  return isIndiaCity(sourceCity) && isIndiaCity(destinationCity);
}

function getIndiaOnlyTransportMessage(category, sourceCity, destinationCity) {
  return `${category} are available only for domestic India routes. ${sourceCity} to ${destinationCity} looks international, so choose Flights or Packages for this trip.`;
}

function buildSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function uniqueImages(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

function getCityImages(city) {
  return CITY_IMAGE_LIBRARY[city] || CITY_IMAGE_LIBRARY.Default;
}

function getCategoryImages(category, city) {
  const cityImages = getCityImages(city);
  const categoryImages = CATEGORY_IMAGE_LIBRARY[category] || [];
  const universal = UNIVERSAL_TRAVEL_IMAGES;

  if (category === "Hotels") return uniqueImages(categoryImages, cityImages, universal);
  if (category === "Homes") return uniqueImages(categoryImages, cityImages, universal);
  if (category === "Packages") return uniqueImages(categoryImages, cityImages, universal);
  if (category === "Tours") return uniqueImages(categoryImages, cityImages, universal);
  if (category === "Flights") return uniqueImages(categoryImages, universal, cityImages.slice(0, 4));
  if (category === "Trains") return uniqueImages(categoryImages, universal, cityImages.slice(0, 3));
  if (category === "Buses") return uniqueImages(categoryImages, universal, cityImages.slice(0, 3));
  if (category === "Cabs") return uniqueImages(categoryImages, universal, cityImages.slice(0, 3));
  if (category === "Insurance") return uniqueImages(categoryImages, universal, cityImages.slice(0, 2));

  return uniqueImages(cityImages, universal);
}

function getCityAreas(city) {
  return CITY_AREAS[city] || [
    "City Centre",
    "Main Market",
    "Business District",
    "Airport Zone",
    "Old Town",
    "Riverside",
    "Central Area",
    "Commercial Hub",
  ];
}

function formatPrice(currency, amount) {
  const code = currency || "INR";
  const numeric = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${code} ${numeric}`;
  }
}

function range(count) {
  return Array.from({ length: count }, (_, index) => index);
}

function buildImageOptions(images, index, seed, extraOffset = 0) {
  if (!images.length) return [FALLBACK_IMAGE];

  const start = (index + seed + extraOffset) % images.length;
  const ordered = [...images.slice(start), ...images.slice(0, start)];
  return uniqueImages(ordered, [FALLBACK_IMAGE]);
}

function buildHotelCards(destinationCity, currency, seed) {
  const images = getCategoryImages("Hotels", destinationCity);
  const areas = getCityAreas(destinationCity);

  return range(8).map((index) => {
    const area = areas[index % areas.length];
    const nightlyPrice = [5200, 6450, 7100, 8350, 9100, 11250, 12800, 14900][index];

    return {
      id: `hotel-${index}`,
      title: `${HOTEL_PATTERNS[index]} ${area}`,
      subtitle: `${area}, ${destinationCity}`,
      imageOptions: buildImageOptions(images, index, seed),
      price: `${formatPrice(currency, nightlyPrice)} / night`,
      badge: `${(4.1 + index * 0.1).toFixed(1)} ★`,
      reviewText: `${640 + index * 183} verified reviews`,
      metaLine: `${[0.8, 1.4, 2.1, 3.6, 4.2, 5.1, 6.3, 7.0][index]} km from city centre`,
      chips: [
        index % 2 === 0 ? "Free cancellation" : "Breakfast available",
        index % 3 === 0 ? "Pay at hotel" : "Couple friendly",
        index % 4 === 0 ? "Airport transfer" : "Popular area",
      ],
      footerNote: index % 2 === 0 ? "Taxes extra · Room only" : "Taxes extra · Breakfast optional",
      action: "View stay",
      url: buildMapsUrl(`${area} hotel ${destinationCity}`),
    };
  });
}

function buildHomeCards(destinationCity, currency, seed) {
  const images = getCategoryImages("Homes", destinationCity);
  const areas = getCityAreas(destinationCity);

  return range(8).map((index) => {
    const area = areas[index % areas.length];
    const nightlyPrice = [3200, 4100, 4850, 5600, 6200, 7600, 8900, 10400][index];

    return {
      id: `home-${index}`,
      title: `${HOME_PATTERNS[index]} ${area}`,
      subtitle: `${area}, ${destinationCity}`,
      imageOptions: buildImageOptions(images, index, seed, 2),
      price: `${formatPrice(currency, nightlyPrice)} / night`,
      badge: `${(4.0 + index * 0.1).toFixed(1)} ★`,
      reviewText: `${210 + index * 94} guest reviews`,
      metaLine: index % 2 === 0 ? "Entire place · 1 bedroom" : "Private stay · Work-friendly",
      chips: [
        "Kitchen",
        index % 2 === 0 ? "Self check-in" : "Long stay deal",
        index % 3 === 0 ? "Free Wi-Fi" : "Air conditioning",
      ],
      footerNote: "Taxes extra · Cleaning may apply",
      action: "View home",
      url: buildSearchUrl(`${area} serviced apartment ${destinationCity}`),
    };
  });
}

function buildPackageCards(sourceCity, destinationCity, currency, seed) {
  const images = getCategoryImages("Packages", destinationCity);

  return range(8).map((index) => {
    const price = [18900, 22400, 25600, 29800, 33200, 38700, 42500, 46800][index];

    return {
      id: `package-${index}`,
      title: `${PACKAGE_PATTERNS[index]} · ${destinationCity}`,
      subtitle: `${sourceCity} to ${destinationCity}`,
      imageOptions: buildImageOptions(images, index, seed, 4),
      price: `From ${formatPrice(currency, price)}`,
      badge: index % 2 === 0 ? "Best value" : "Popular",
      reviewText: `${95 + index * 31} package searches this week`,
      metaLine: index % 2 === 0 ? "Stay + transfers + flexible dates" : "Stay + breakfast + sightseeing",
      chips: [
        "Hotel included",
        index % 2 === 0 ? "Airport transfer" : "Sightseeing",
        index % 3 === 0 ? "Breakfast" : "Flexible date",
      ],
      footerNote: "Per traveller basis · Terms apply",
      action: "Explore package",
      url: buildSearchUrl(`${sourceCity} ${destinationCity} package`),
    };
  });
}

function buildFlightCards(sourceCity, destinationCity, currency, seed) {
  const images = getCategoryImages("Flights", destinationCity);

  return range(8).map((index) => {
    const pattern = FLIGHT_PATTERNS[index];
    const price = [5400, 6150, 6820, 7450, 8120, 8990, 9640, 10350][index];

    return {
      id: `flight-${index}`,
      title: `${sourceCity} → ${destinationCity}`,
      subtitle: pattern.title,
      imageOptions: buildImageOptions(images, index, seed, 1),
      price: formatPrice(currency, price),
      badge: index % 2 === 0 ? "Non-stop" : "Popular timing",
      reviewText: pattern.time,
      metaLine: `Duration ${pattern.duration}`,
      chips: [
        index % 2 === 0 ? "Cabin bag" : "Saver fare",
        "Route specific",
        index % 3 === 0 ? "Refundable option" : "Meal add-on",
      ],
      footerNote: "Fare shown before convenience fee",
      action: "View flight",
      url: buildSearchUrl(`${sourceCity} to ${destinationCity} flight`),
    };
  });
}

function buildTrainCards(sourceCity, destinationCity, currency, seed) {
  const images = getCategoryImages("Trains", destinationCity);

  return range(8).map((index) => {
    const pattern = TRAIN_PATTERNS[index];
    const price = [780, 940, 1160, 1380, 1620, 1880, 2140, 2360][index];

    return {
      id: `train-${index}`,
      title: `${sourceCity} → ${destinationCity}`,
      subtitle: pattern.title,
      imageOptions: buildImageOptions(images, index, seed, 3),
      price: `From ${formatPrice(currency, price)}`,
      badge: "Rail route",
      reviewText: pattern.time,
      metaLine: `Travel time ${pattern.duration}`,
      chips: [
        index % 2 === 0 ? "Chair car" : "Sleeper option",
        "Station boarding",
        index % 3 === 0 ? "Morning route" : "Flexible timing",
      ],
      footerNote: "Illustrative route options",
      action: "Check route",
      url: buildSearchUrl(`${sourceCity} to ${destinationCity} train route`),
    };
  });
}

function buildBusCards(sourceCity, destinationCity, currency, seed) {
  const images = getCategoryImages("Buses", destinationCity);

  return range(8).map((index) => {
    const pattern = BUS_PATTERNS[index];
    const price = [920, 1080, 1260, 1440, 1630, 1850, 2060, 2240][index];

    return {
      id: `bus-${index}`,
      title: `${sourceCity} → ${destinationCity}`,
      subtitle: pattern.title,
      imageOptions: buildImageOptions(images, index, seed, 5),
      price: `From ${formatPrice(currency, price)}`,
      badge: "Road route",
      reviewText: pattern.time,
      metaLine: `Travel time ${pattern.duration}`,
      chips: [
        index % 2 === 0 ? "Sleeper coach" : "AC seater",
        "Boarding point",
        index % 3 === 0 ? "Night route" : "Flexible cancellation",
      ],
      footerNote: "Illustrative road options",
      action: "Check bus",
      url: buildSearchUrl(`${sourceCity} to ${destinationCity} bus ticket`),
    };
  });
}

function buildCabCards(sourceCity, destinationCity, currency, seed) {
  const images = getCategoryImages("Cabs", destinationCity);

  return range(8).map((index) => {
    const price = [5200, 6150, 7120, 8450, 9680, 10850, 12200, 13800][index];

    return {
      id: `cab-${index}`,
      title: `${sourceCity} → ${destinationCity}`,
      subtitle: CAB_PATTERNS[index],
      imageOptions: buildImageOptions(images, index, seed, 2),
      price: `From ${formatPrice(currency, price)}`,
      badge: "Private ride",
      reviewText: index % 2 === 0 ? "Sedan / hatchback" : "SUV / comfort",
      metaLine: index % 2 === 0 ? "Door pickup available" : "Multiple stop option",
      chips: [
        "Driver included",
        index % 2 === 0 ? "One-way ride" : "Round trip",
        index % 3 === 0 ? "Toll extra" : "Fuel included",
      ],
      footerNote: "Based on route and cab type",
      action: "View route",
      url: `https://www.google.com/maps/dir/${encodeURIComponent(sourceCity)}/${encodeURIComponent(destinationCity)}`,
    };
  });
}

function buildTourCards(destinationCity, currency, seed) {
  const images = getCategoryImages("Tours", destinationCity);
  const areas = getCityAreas(destinationCity);

  return range(8).map((index) => {
    const area = areas[index % areas.length];
    const price = [900, 1250, 1580, 1820, 2140, 2450, 2790, 3250][index];

    return {
      id: `tour-${index}`,
      title: `${TOUR_PATTERNS[index]} · ${area}`,
      subtitle: `${area}, ${destinationCity}`,
      imageOptions: buildImageOptions(images, index, seed, 6),
      price: formatPrice(currency, price),
      badge: `${(4.2 + index * 0.1).toFixed(1)} ★`,
      reviewText: `${72 + index * 28} recent bookings`,
      metaLine: index % 2 === 0 ? "2–4 hours · Guided" : "Flexible timing · Local host",
      chips: [
        "Instant idea",
        index % 2 === 0 ? "Popular spot" : "Local route",
        index % 3 === 0 ? "Photo stop" : "Family friendly",
      ],
      footerNote: "Entry fee may vary by attraction",
      action: "View experience",
      url: buildSearchUrl(`${area} ${destinationCity} things to do`),
    };
  });
}

function buildInsuranceCards(destinationCity, currency, seed) {
  const images = getCategoryImages("Insurance", destinationCity);

  return range(8).map((index) => {
    const price = [399, 520, 680, 790, 920, 1100, 1290, 1540][index];

    return {
      id: `insurance-${index}`,
      title: INSURANCE_PATTERNS[index],
      subtitle: `For trips connected to ${destinationCity}`,
      imageOptions: buildImageOptions(images, index, seed, 7),
      price: `From ${formatPrice(currency, price)}`,
      badge: index % 2 === 0 ? "Essential" : "Popular",
      reviewText: index % 2 === 0 ? "Medical + delay support" : "Delay + baggage protection",
      metaLine: index % 2 === 0 ? "Trip-level cover idea" : "Flexible protection idea",
      chips: [
        "Claim support",
        index % 2 === 0 ? "Medical cover" : "Baggage cover",
        index % 3 === 0 ? "Cancellation support" : "Travel delay",
      ],
      footerNote: "Policy terms and limits apply",
      action: "View cover",
      url: buildSearchUrl(`${destinationCity} travel cover plan`),
    };
  });
}

function buildCards(category, sourceCity, destinationCity, currency, seed) {
  if (category === "Hotels") return buildHotelCards(destinationCity, currency, seed);
  if (category === "Homes") return buildHomeCards(destinationCity, currency, seed);
  if (category === "Packages") return buildPackageCards(sourceCity, destinationCity, currency, seed);
  if (category === "Flights") return buildFlightCards(sourceCity, destinationCity, currency, seed);
  if (category === "Trains") return buildTrainCards(sourceCity, destinationCity, currency, seed);
  if (category === "Buses") return buildBusCards(sourceCity, destinationCity, currency, seed);
  if (category === "Cabs") return buildCabCards(sourceCity, destinationCity, currency, seed);
  if (category === "Tours") return buildTourCards(destinationCity, currency, seed);
  return buildInsuranceCards(destinationCity, currency, seed);
}

function SafeImage({ imageOptions, alt }) {
  const safeOptions = imageOptions?.length ? imageOptions : [FALLBACK_IMAGE];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [alt, safeOptions[0]]);

  const src = safeOptions[imageIndex] || FALLBACK_IMAGE;

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => {
        setImageIndex((prev) => {
          if (prev < safeOptions.length - 1) return prev + 1;
          return prev;
        });
      }}
    />
  );
}

function CatalogCard({ card }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
      <div className="h-52 overflow-hidden bg-slate-100">
        <SafeImage imageOptions={card.imageOptions} alt={card.title} />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {card.badge}
            </div>
            <h3 className="mt-3 text-[1.5rem] font-black leading-[1.05] tracking-[-0.05em] text-slate-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {card.subtitle}
            </p>
          </div>

          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            title={card.action}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock3 className="h-4 w-4 text-slate-400" />
            {card.reviewText}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            {card.metaLine}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {card.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Price
            </p>
            <p className="mt-1 text-[1.9rem] font-black leading-none tracking-[-0.05em] text-slate-950">
              {card.price}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-400">
              {card.footerNote}
            </p>
          </div>

          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            {card.action}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}


function IndiaOnlyTransportNotice({ category, sourceCity, destinationCity }) {
  return (
    <div className="mt-8 overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 shadow-xl shadow-amber-500/10 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-amber-500 text-white shadow-xl shadow-amber-500/25">
            <Shield className="h-8 w-8" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
              India-only transport
            </p>

            <h3 className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-950">
              {category} are not available for this route.
            </h3>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-8 text-slate-600">
              {getIndiaOnlyTransportMessage(category, sourceCity, destinationCity)}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                Route: {sourceCity} → {destinationCity}
              </span>
              <span className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm">
                Recommended: Flights / Packages
              </span>
            </div>
          </div>
        </div>

        <a
          href={`https://www.google.com/travel/flights?q=${encodeURIComponent(
            `${sourceCity} to ${destinationCity}`,
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
        >
          Check Flights
          <Plane className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}


export default function TravelCatalogPanel({ form, activeCategory }) {
  const sourceCity = normalizeCity(form?.source_city || "Kolkata");
  const destinationCity = normalizeCity(form?.destination_city || "Bengaluru");
  const category = resolveCategory(
    activeCategory ??
      form?.product_category ??
      form?.active_category ??
      form?.selected_category ??
      form?.category ??
      form?.current_mode ??
      "Hotels",
  );
  const currency = form?.currency || "INR";

  const meta = CATEGORY_META[category] || CATEGORY_META.Hotels;
  const Icon = meta.icon;
  const isIndiaOnlyTransport =
    INDIA_ONLY_TRANSPORT_CATEGORIES.has(category) &&
    !isDomesticIndiaRoute(sourceCity, destinationCity);

  const [seed, setSeed] = useState(0);

  const cards = useMemo(() => {
    if (isIndiaOnlyTransport) return [];
    return buildCards(category, sourceCity, destinationCity, currency, seed);
  }, [category, sourceCity, destinationCity, currency, seed, isIndiaOnlyTransport]);

  return (
    <section className="relative bg-[#f5f7fb] px-3 pb-16 pt-8 lg:px-4 xl:px-6">
      <div className="mx-auto w-full max-w-[1920px]">
        <div className="rounded-[2.8rem] border border-slate-200 bg-white p-5 shadow-[0_28px_110px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8 xl:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                <Icon className="h-4 w-4" />
                {meta.eyebrow}
              </div>

              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.08em] text-slate-950 sm:text-5xl xl:text-6xl">
                {meta.title(sourceCity, destinationCity)}
              </h2>

              <p className="mt-4 max-w-4xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                {meta.description(sourceCity, destinationCity)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSeed((current) => current + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-8 rounded-[1.8rem] border border-blue-100 bg-blue-50/60 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-black tracking-[-0.04em] text-slate-950">
                    Recommended options for your trip
                  </p>
                  <p className="mt-1 text-sm font-semibold text-blue-700">
                    Showing {cards.length} {meta.countLabel} for {sourceCity} to {destinationCity}.
                  </p>
                </div>
              </div>

              <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm md:block">
                {cards.length} options
              </div>
            </div>
          </div>

          {isIndiaOnlyTransport ? (
            <IndiaOnlyTransportNotice
              category={category}
              sourceCity={sourceCity}
              destinationCity={destinationCity}
            />
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {cards.map((card) => (
                <CatalogCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}