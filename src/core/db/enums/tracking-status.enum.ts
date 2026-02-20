export enum TrackingStatus {
    REGISTERED = 'REGISTERED',
    ARRIVED_CHINA_WAREHOUSE = 'ARRIVED_CHINA_WAREHOUSE',
    ARRIVED_BRANCH = 'ARRIVED_BRANCH',
    PICKED_UP = 'PICKED_UP',
}

export const STATUS_ORDER: Record<TrackingStatus, number> = {
    [TrackingStatus.REGISTERED]: 0,
    [TrackingStatus.ARRIVED_CHINA_WAREHOUSE]: 1,
    [TrackingStatus.ARRIVED_BRANCH]: 2,
    [TrackingStatus.PICKED_UP]: 3,
};

// Statuses that ADMIN can set manually
export const ADMIN_ALLOWED_STATUSES: TrackingStatus[] = [
    TrackingStatus.ARRIVED_BRANCH,
    TrackingStatus.PICKED_UP,
];
