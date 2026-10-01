import { startWeeklyReportScheduler } from './weekly-report-scheduler';

// Initialize application services that need to run on server startup
export function initializeAppServices() {
  // Only start the scheduler in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WEEKLY_REPORT_SCHEDULER === 'true') {
    try {
      startWeeklyReportScheduler();
      console.log('Application services initialized successfully');
    } catch (error) {
      console.error('Error initializing application services:', error);
    }
  } else {
    console.log('Weekly report scheduler disabled in development mode');
  }
}