export enum TrackingStatus {
    REGISTERED = 'REGISTERED',
    ARRIVED_CHINA_WAREHOUSE = 'ARRIVED_CHINA_WAREHOUSE',
    SENT_TO_KZ = 'SENT_TO_KZ',
    ARRIVED_BRANCH = 'ARRIVED_BRANCH',
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',
    PICKED_UP = 'PICKED_UP',
    CANCELLED = 'CANCELLED',
}

export const STATUS_ORDER: Record<TrackingStatus, number> = {
    [TrackingStatus.REGISTERED]: 0,
    [TrackingStatus.ARRIVED_CHINA_WAREHOUSE]: 1,
    [TrackingStatus.SENT_TO_KZ]: 2,
    [TrackingStatus.ARRIVED_BRANCH]: 3,
    [TrackingStatus.READY_FOR_PICKUP]: 4,
    [TrackingStatus.PICKED_UP]: 5,
    [TrackingStatus.CANCELLED]: 99,
};

// Statuses that ADMIN can set manually
export const ADMIN_ALLOWED_STATUSES: TrackingStatus[] = [
    TrackingStatus.READY_FOR_PICKUP,
    TrackingStatus.PICKED_UP,
];
