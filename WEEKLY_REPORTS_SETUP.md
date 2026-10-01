# Weekly Reports Feature Setup

The Automatic Weekly Reports feature has been successfully implemented. Here's how to use and configure it:

## Features Implemented

### 1. Database Schema
- **WeeklyReport Model**: Stores generated weekly reports with complete data
- **Settings Enhancement**: Added fields for weekly report configuration
  - `weeklyReportEnabled`: Boolean to enable/disable automatic reports
  - `weeklyReportSchedule`: Cron schedule (default: "0 9 * * 1" for Monday 9 AM)
  - `weeklyReportRecipients`: JSON array of email addresses
   
### 2. API Endpoints
- **POST /api/reports/weekly/generate**: Generate weekly report for a specific date range
- **POST /api/reports/weekly/send**: Send a specific weekly report via email
- **GET /api/reports/weekly/history**: List all previous weekly reports (admin only)
- **GET /api/reports/weekly/[id]**: Fetch detailed report data (admin only)
- **POST /api/reports/weekly/scheduler**: Control the automatic scheduler
- **GET /api/reports/weekly/scheduler**: Get scheduler status

### 3. Admin Interface
- **/dashboard/admin/reports/weekly**: Complete admin interface for:
  - Viewing report history
  - Generating new reports manually
  - Sending reports via email
  - Configuring automatic scheduling
  - Managing email recipients
  - Viewing detailed report data

### 4. Automated Scheduling
- Uses `node-cron` for scheduling
- Default schedule: Every Monday at 9:00 AM
- Configurable via admin interface
- Automatically generates and sends reports when enabled

## Setup Instructions

### 1. Environment Variables
Ensure the following environment variables are set in your `.env` file:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. Initialize the Scheduler
To start the automatic scheduler when your server starts, you have two options:

#### Option 1: Manual Initialization (Development)
Call the initialization endpoint when your server starts:
```bash
curl http://localhost:3000/api/_init
```

#### Option 2: Automatic Initialization (Production)
Add this to your Next.js configuration or create a custom server file. For production deployment, you may want to use a process manager like PM2 or a serverless cron solution.

### 3. Configure Weekly Reports
1. Navigate to `/dashboard/admin/reports/weekly`
2. Click "Configure Settings" in the Automatic Scheduling section
3. Enable automatic reports
4. Set the schedule (cron format)
5. Add email recipients
6. Save settings

## Report Content

The weekly report includes:
- **Beginning Inventory**: Total stock value at week start
- **Purchases**: Total purchases received during the week
- **Sales**: Apparel and Burn Box sales breakdown
- **Inventory Deductions**: Total quantity deducted from sales
- **Ending Inventory**: Total stock value at week end
- **Inventory Adjustments**: Manual stock adjustments
- **Wastage/Damage**: From ingredient adjustments
- **Inventory Value Analysis**: Value variance analysis
- **Gross Profit**: Total revenue, COGS, and margin
- **GymMaster Comparison**: Compare with GymMaster sales data
- **Discrepancies & Alerts**: Unusual activity and discrepancies

## Cron Schedule Format

The schedule uses standard cron format: `minute hour day month dayOfWeek`

Examples:
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 8 * * 1` - Every Monday at 8:00 AM
- `0 9 * * 0` - Every Sunday at 9:00 AM
- `0 9 1 * *` - 1st of every month at 9:00 AM
- `0 9 * * 1-5` - Monday to Friday at 9:00 AM

## Testing

1. **Generate Manual Report**:
   - Go to `/dashboard/admin/reports/weekly`
   - Select a date range
   - Click "Generate Report"

2. **Test Email Sending**:
   - Generate a report
   - Click the send button next to the report
   - Check if email is received

3. **Test Scheduler**:
   - Configure scheduler settings
   - Start the scheduler
   - Monitor console logs for scheduled execution

## Production Deployment

For production deployment, consider:

1. **Server Environment**: Ensure the scheduler initialization is called when your server starts
2. **Email Configuration**: Use production email credentials
3. **Error Handling**: Monitor failed reports and configure retry logic
4. **Time Zone**: Ensure your server's time zone is correct for scheduling
5. **Monitoring**: Set up logging and monitoring for the scheduler

## Troubleshooting

- **Reports not sending**: Check email credentials and recipient configuration
- **Scheduler not running**: Ensure initialization endpoint is called and settings are enabled
- **Reports missing data**: Check that your database has data for the selected period
- **Email not received**: Check spam folder and email service logs

## Future Enhancements

Potential improvements:
- PDF report generation and attachment
- Custom report templates
- Multiple schedule configurations
- Report export to CSV/Excel
- Advanced filtering and analytics
- Integration with external reporting tools