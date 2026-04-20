/**
 * @todo Usar estas otras a través del sistema
 */

export interface IRouteResponse {
  code?: string;
  routes?: Route[];
  waypoints?: Waypoint[];
  message?: string;
}

export interface IMatchResponse {
  code?: string;
  tracepoints?: Tracepoint[];
  matchings?: Matchings[];
}

export interface Route {
  legs: Leg[];
  distance: number;
  duration: number;
  weight_name: string;
  weight: number;
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

export interface Leg {
  steps: Step[];
  distance: number;
  duration: number;
  summary: string;
  weight: number;
}

export interface Step {
  intersections: Intersection[];
  driving_side: DrivingSide;
  geometry: string;
  mode: Mode;
  duration: number;
  maneuver: Maneuver;
  weight: number;
  distance: number;
  name: string;
}

export enum DrivingSide {
  Left = 'left',
  Right = 'right',
  SlightLeft = 'slight left',
  Straight = 'straight',
}

export interface Intersection {
  out?: number;
  entry: boolean[];
  bearings: number[];
  location: number[];
  in?: number;
}

export interface Maneuver {
  bearing_after: number;
  type: string;
  modifier?: DrivingSide;
  bearing_before: number;
  location: number[];
}

export enum Mode {
  Driving = 'driving',
}

export interface Waypoint {
  hint: string;
  distance: number;
  name: string;
  location: number[];
}

export interface Tracepoint extends Waypoint {
  //   matchings_index: Index to the Route object in matchings the sub-trace was matched to.
  // waypoint_index: Index of the waypoint inside the matched route.
  // alternatives_count: Number of probable alternative matchings for this trace point. A value of zero indicate that this point was matched unambiguously. Split the trace at these points for incremental map matching.
  matchings_index?: number;
  waypoint_index?: number;
  alternatives_count?: number;
}

export interface Matchings extends Route {
  // confidence: Confidence of the matching. float value between 0 and 1. 1 is very confident that the matching is correct.
  confidence?: number;
}

export interface INearest {
  hint: string;
  distance: number;
  name: string;
  location: number[];
}

export interface INearestResponse {
  waypoints: INearest[];
  code: string;
}
