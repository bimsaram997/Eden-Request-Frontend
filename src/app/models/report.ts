export interface HousekeeperReportDto {
    kpis: HousekeeperKpiDto;
    weeklyTrend: WeeklyTrendDto[];
    todayTaskLog: CompletedTaskLogDto[];
}

export interface HousekeeperKpiDto {
    extraWorkCompletedToday: number;
    suppliesRequestedToday: number;
    avgSetupSpeedMinutes: number;
    pendingAssignedTasks: number;
}

export interface WeeklyTrendDto {
    dayName: string;
    suppliesRequested: number;
    extraWorkCompleted: number;
}

export interface CompletedTaskLogDto {
    roomNumber: string;
    category: string;
    description: string;
    completedAt: string;
}