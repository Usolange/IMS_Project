USE [master]
GO
/****** Object:  Database [ims_db]    Script Date: 7/24/2025 7:05:24 PM ******/
CREATE DATABASE [ims_db]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'ims_db', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\ims_db.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'ims_db_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\ims_db_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [ims_db] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [ims_db].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [ims_db] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [ims_db] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [ims_db] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [ims_db] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [ims_db] SET ARITHABORT OFF 
GO
ALTER DATABASE [ims_db] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [ims_db] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [ims_db] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [ims_db] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [ims_db] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [ims_db] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [ims_db] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [ims_db] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [ims_db] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [ims_db] SET  DISABLE_BROKER 
GO
ALTER DATABASE [ims_db] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [ims_db] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [ims_db] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [ims_db] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [ims_db] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [ims_db] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [ims_db] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [ims_db] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [ims_db] SET  MULTI_USER 
GO
ALTER DATABASE [ims_db] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [ims_db] SET DB_CHAINING OFF 
GO
ALTER DATABASE [ims_db] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [ims_db] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [ims_db] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [ims_db] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [ims_db] SET QUERY_STORE = ON
GO
ALTER DATABASE [ims_db] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [ims_db]
GO
/****** Object:  Table [dbo].[penalty_logs]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[penalty_logs](
	[penalty_id] [int] IDENTITY(1,1) NOT NULL,
	[save_id] [int] NULL,
	[member_id] [int] NULL,
	[iki_id] [int] NULL,
	[slot_id] [int] NULL,
	[penalty_type] [varchar](10) NULL,
	[penalty_amount] [decimal](10, 2) NULL,
	[rule_time_limit_minutes] [int] NULL,
	[actual_saving_time] [time](7) NULL,
	[allowed_time_limit] [time](7) NULL,
	[saving_date] [date] NULL,
	[created_at] [datetime] NULL,
	[is_paid] [bit] NULL,
	[paid_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[penalty_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[loans]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[loans](
	[loan_id] [int] IDENTITY(1,1) NOT NULL,
	[member_id] [int] NOT NULL,
	[iki_id] [int] NOT NULL,
	[requested_amount] [decimal](12, 2) NOT NULL,
	[approved_amount] [decimal](12, 2) NULL,
	[interest_rate] [decimal](5, 2) NULL,
	[total_repayable] [decimal](12, 2) NULL,
	[status] [varchar](20) NULL,
	[request_date] [datetime] NULL,
	[approval_date] [datetime] NULL,
	[disbursed_date] [datetime] NULL,
	[due_date] [datetime] NULL,
	[repayment_completed_date] [datetime] NULL,
	[phone_disbursed_to] [varchar](20) NULL,
	[created_at] [datetime] NULL,
	[round_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[loan_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[loan_interest]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[loan_interest](
	[interest_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NOT NULL,
	[interest_rate] [decimal](5, 2) NOT NULL,
	[interest_amount] [decimal](12, 2) NOT NULL,
	[calculated_on_date] [datetime] NULL,
	[due_date] [datetime] NULL,
	[is_paid] [bit] NULL,
	[paid_date] [datetime] NULL,
	[created_at] [datetime] NULL,
	[payment_status] [varchar](20) NULL,
	[timing_status] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[interest_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[member_saving_activities]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[member_saving_activities](
	[save_id] [int] IDENTITY(1,1) NOT NULL,
	[member_id] [int] NOT NULL,
	[slot_id] [int] NOT NULL,
	[saved_amount] [decimal](10, 2) NOT NULL,
	[saved_at] [datetime] NULL,
	[penalty_applied] [decimal](10, 2) NULL,
	[is_late] [bit] NULL,
	[phone_used] [varchar](20) NULL,
	[momo_reference_id] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[save_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_GroupAvailableMoney]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[vw_GroupAvailableMoney] AS
SELECT
    ISNULL((
        SELECT SUM(saved_amount)
        FROM member_saving_activities
    ), 0) AS total_savings,

    ISNULL((
        SELECT SUM(penalty_amount)
        FROM penalty_logs
        WHERE is_paid = 1
    ), 0) AS total_paid_penalties,

    ISNULL((
        SELECT SUM(interest_amount)
        FROM loan_interest
        WHERE is_paid = 1
    ), 0) AS total_interest_paid,

    ISNULL((
        SELECT SUM(approved_amount)
        FROM loans
        WHERE status IN ('approved', 'disbursed')
    ), 0) AS total_disbursed_loans,

    -- Final calculation
    (
        ISNULL((SELECT SUM(saved_amount) FROM member_saving_activities), 0)
      + ISNULL((SELECT SUM(penalty_amount) FROM penalty_logs WHERE is_paid = 1), 0)
      + ISNULL((SELECT SUM(interest_amount) FROM loan_interest WHERE is_paid = 1), 0)
      - ISNULL((SELECT SUM(approved_amount) FROM loans WHERE status IN ('approved', 'disbursed')), 0)
    ) AS group_available_money;
GO
/****** Object:  Table [dbo].[frequency_category_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[frequency_category_info](
	[f_id] [int] IDENTITY(1,1) NOT NULL,
	[f_category] [varchar](10) NOT NULL,
	[sad_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[f_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[gudian_members]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[gudian_members](
	[gm_id] [int] IDENTITY(1,1) NOT NULL,
	[gm_names] [varchar](100) NOT NULL,
	[gm_Nid] [varchar](16) NOT NULL,
	[gm_phonenumber] [varchar](12) NOT NULL,
	[iki_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[gm_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ik_daily_time_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ik_daily_time_info](
	[dtime_id] [int] IDENTITY(1,1) NOT NULL,
	[ikimina_name] [varchar](50) NOT NULL,
	[dtime_time] [time](7) NOT NULL,
	[f_id] [int] NOT NULL,
	[location_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[dtime_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ik_monthly_time_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ik_monthly_time_info](
	[monthlytime_id] [int] IDENTITY(1,1) NOT NULL,
	[ikimina_name] [varchar](50) NOT NULL,
	[monthlytime_date] [int] NOT NULL,
	[monthlytime_time] [time](7) NOT NULL,
	[f_id] [int] NOT NULL,
	[location_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[monthlytime_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ik_weekly_time_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ik_weekly_time_info](
	[weeklytime_id] [int] IDENTITY(1,1) NOT NULL,
	[ikimina_name] [varchar](100) NOT NULL,
	[weeklytime_day] [varchar](70) NOT NULL,
	[weeklytime_time] [time](7) NOT NULL,
	[f_id] [int] NOT NULL,
	[location_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[weeklytime_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_info](
	[iki_id] [int] IDENTITY(1,1) NOT NULL,
	[iki_name] [varchar](50) NOT NULL,
	[iki_email] [varchar](100) NOT NULL,
	[iki_username] [varchar](50) NOT NULL,
	[iki_password] [varchar](30) NOT NULL,
	[location_id] [int] NOT NULL,
	[f_id] [int] NOT NULL,
	[dayOfEvent] [varchar](50) NULL,
	[timeOfEvent] [time](7) NULL,
	[numberOfEvents] [int] NULL,
	[weekly_saving_days] [varchar](max) NULL,
	[monthly_saving_days] [varchar](max) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[iki_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_locations]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_locations](
	[location_id] [int] IDENTITY(1,1) NOT NULL,
	[ikimina_name] [varchar](255) NOT NULL,
	[province] [varchar](255) NOT NULL,
	[district] [varchar](255) NOT NULL,
	[sector] [varchar](255) NOT NULL,
	[cell] [varchar](255) NOT NULL,
	[village] [varchar](255) NOT NULL,
	[sad_id] [int] NOT NULL,
	[f_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[location_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_rounds]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_rounds](
	[round_id] [int] IDENTITY(1,1) NOT NULL,
	[iki_id] [int] NOT NULL,
	[round_number] [int] NOT NULL,
	[round_year] [int] NOT NULL,
	[start_date] [date] NOT NULL,
	[end_date] [date] NOT NULL,
	[round_status] [varchar](50) NOT NULL,
	[number_of_categories] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[round_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_saving_rules]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_saving_rules](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[iki_id] [int] NOT NULL,
	[round_id] [int] NOT NULL,
	[saving_ratio] [decimal](12, 2) NULL,
	[time_delay_penalty] [decimal](12, 2) NULL,
	[date_delay_penalty] [decimal](12, 2) NULL,
	[time_limit_minutes] [int] NULL,
	[created_at] [datetime] NULL,
	[interest_rate_percent] [decimal](5, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_saving_slots]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_saving_slots](
	[slot_id] [int] IDENTITY(1,1) NOT NULL,
	[iki_id] [int] NOT NULL,
	[slot_date] [date] NOT NULL,
	[slot_time] [time](7) NOT NULL,
	[frequency_category] [varchar](10) NOT NULL,
	[slot_status] [varchar](10) NOT NULL,
	[created_at] [datetime] NULL,
	[round_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[slot_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[loan_balance_history]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[loan_balance_history](
	[history_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NULL,
	[remaining_balance] [decimal](9, 2) NULL,
	[interest_added] [decimal](9, 2) NULL,
	[interest_applied_date] [datetime] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[history_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[loan_prediction_data]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[loan_prediction_data](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[member_id] [int] NOT NULL,
	[saving_frequency] [varchar](20) NULL,
	[saving_times_per_period] [int] NULL,
	[total_saving_cycles] [int] NULL,
	[completed_saving_cycles] [int] NULL,
	[user_savings_made] [int] NULL,
	[total_current_saving] [decimal](18, 2) NULL,
	[ikimina_created_year] [int] NULL,
	[coverd_rounds] [int] NULL,
	[member_round] [int] NULL,
	[recent_loan_payment_status] [varchar](20) NULL,
	[saving_status] [varchar](20) NULL,
	[has_guardian] [bit] NULL,
	[round_id] [int] NULL,
	[member_Join_Year] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[loan_repayments]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[loan_repayments](
	[repayment_id] [int] IDENTITY(1,1) NOT NULL,
	[loan_id] [int] NOT NULL,
	[member_id] [int] NOT NULL,
	[amount_paid] [decimal](12, 2) NOT NULL,
	[payment_method] [varchar](20) NULL,
	[phone_used] [varchar](20) NULL,
	[payment_date] [datetime] NULL,
	[is_full_payment] [bit] NULL,
	[created_at] [datetime] NULL,
	[payment_status] [varchar](20) NULL,
	[timing_status] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[repayment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[member_access_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[member_access_info](
	[maccess_id] [int] IDENTITY(1,1) NOT NULL,
	[member_id] [int] NOT NULL,
	[member_code] [char](5) NOT NULL,
	[member_pass] [char](5) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[maccess_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[member_type_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[member_type_info](
	[member_type_id] [int] IDENTITY(1,1) NOT NULL,
	[member_type] [varchar](50) NOT NULL,
	[type_desc] [varchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[member_type_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[members_info]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[members_info](
	[member_id] [int] IDENTITY(1,1) NOT NULL,
	[member_names] [varchar](100) NOT NULL,
	[member_Nid] [varchar](16) NULL,
	[gm_Nid] [varchar](50) NULL,
	[member_phone_number] [varchar](12) NOT NULL,
	[member_email] [varchar](100) NULL,
	[member_type_id] [int] NOT NULL,
	[iki_id] [int] NOT NULL,
	[m_status] [varchar](20) NOT NULL,
	[joined_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[member_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notification_logs]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notification_logs](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[save_id] [int] NOT NULL,
	[member_id] [int] NOT NULL,
	[iki_id] [int] NOT NULL,
	[slot_id] [int] NOT NULL,
	[sms_sent] [bit] NOT NULL,
	[email_sent] [bit] NOT NULL,
	[sms_error] [nvarchar](max) NULL,
	[email_error] [nvarchar](max) NULL,
	[sent_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[password_resets]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[password_resets](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[sad_id] [int] NOT NULL,
	[token] [varchar](255) NOT NULL,
	[created_at] [datetime] NOT NULL,
	[expires_at] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[supper_admin]    Script Date: 7/24/2025 7:05:24 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[supper_admin](
	[sad_id] [int] IDENTITY(1,1) NOT NULL,
	[sad_names] [varchar](100) NOT NULL,
	[sad_email] [varchar](100) NOT NULL,
	[sad_username] [varchar](50) NOT NULL,
	[sad_phone] [varchar](12) NOT NULL,
	[sad_loc] [varchar](20) NOT NULL,
	[sad_pass] [varchar](30) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[sad_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[frequency_category_info] ON 

INSERT [dbo].[frequency_category_info] ([f_id], [f_category], [sad_id]) VALUES (1, N'Daily', 1)
INSERT [dbo].[frequency_category_info] ([f_id], [f_category], [sad_id]) VALUES (2, N'Weekly', 1)
INSERT [dbo].[frequency_category_info] ([f_id], [f_category], [sad_id]) VALUES (3, N'Monthly', 1)
SET IDENTITY_INSERT [dbo].[frequency_category_info] OFF
GO
SET IDENTITY_INSERT [dbo].[gudian_members] ON 

INSERT [dbo].[gudian_members] ([gm_id], [gm_names], [gm_Nid], [gm_phonenumber], [iki_id]) VALUES (1, N'HARERIMANA Alphonse', N'1196680056500008', N'0787439508', 3)
SET IDENTITY_INSERT [dbo].[gudian_members] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_daily_time_info] ON 

INSERT [dbo].[ik_daily_time_info] ([dtime_id], [ikimina_name], [dtime_time], [f_id], [location_id]) VALUES (1, N'Tuzamurane', CAST(N'17:30:00' AS Time), 1, 1)
INSERT [dbo].[ik_daily_time_info] ([dtime_id], [ikimina_name], [dtime_time], [f_id], [location_id]) VALUES (2, N'zigamaGroup', CAST(N'10:00:00' AS Time), 1, 5)
SET IDENTITY_INSERT [dbo].[ik_daily_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_monthly_time_info] ON 

INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (1, N'Umurava', 5, CAST(N'10:00:00' AS Time), 3, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (2, N'Twitezimbere', 5, CAST(N'17:00:00' AS Time), 3, 4)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (3, N'Twitezimbere', 15, CAST(N'17:00:00' AS Time), 3, 4)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (4, N'Twitezimbere', 25, CAST(N'17:00:00' AS Time), 3, 4)
SET IDENTITY_INSERT [dbo].[ik_monthly_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_weekly_time_info] ON 

INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (1, N'NEW Vission', N'Monday', CAST(N'15:00:00' AS Time), 2, 2)
INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (2, N'NEW Vission', N'Wednesday', CAST(N'15:00:00' AS Time), 2, 2)
INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (3, N'NEW Vission', N'Friday', CAST(N'15:00:00' AS Time), 2, 2)
SET IDENTITY_INSERT [dbo].[ik_weekly_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_info] ON 

INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at]) VALUES (1, N'Tuzamurane', N'elinsengimana@gmail.com', N'tuzamurane', N'12345', 1, 1, N'Daily', CAST(N'17:30:00' AS Time), 1, NULL, NULL, CAST(N'2025-07-22T19:39:31.273' AS DateTime))
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at]) VALUES (2, N'NEW Vission', N'newvission@gmail.com', N'newvission', N'12345', 2, 2, N'Monday, Wednesday, Friday', CAST(N'15:00:00' AS Time), 3, N'["Monday","Wednesday","Friday"]', NULL, CAST(N'2025-07-22T19:40:27.957' AS DateTime))
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at]) VALUES (3, N'Umurava', N'uwingabiresolange2000@gmail.com', N'umurava', N'12345', 3, 3, N'5', CAST(N'10:00:00' AS Time), 1, NULL, N'[5]', CAST(N'2025-07-22T19:41:02.413' AS DateTime))
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at]) VALUES (4, N'Twitezimbere', N'twitezimbere@gmail.com', N'twitezimbere', N'12345', 4, 3, N'5, 15, 25', CAST(N'17:00:00' AS Time), 3, NULL, N'[5,15,25]', CAST(N'2025-07-22T19:41:41.020' AS DateTime))
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at]) VALUES (5, N'zigamaGroup', N'zigama@gmail.com', N'zigama', N'12345', 5, 1, N'Daily', CAST(N'10:00:00' AS Time), 1, NULL, NULL, CAST(N'2025-07-23T10:47:48.770' AS DateTime))
SET IDENTITY_INSERT [dbo].[ikimina_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_locations] ON 

INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (1, N'Tuzamurane', N'Amajyepfo', N'Kamonyi', N'Musambira', N'Mpushi', N'Kamashashi', 1, 1)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (2, N'NEW Vission', N'Amajyepfo', N'Kamonyi', N'Musambira', N'Kivumu', N'Gahondo', 1, 2)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (3, N'Umurava', N'Amajyepfo', N'Kamonyi', N'Musambira', N'Cyambwe', N'Gacaca', 1, 3)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (4, N'Twitezimbere', N'Amajyepfo', N'Kamonyi', N'Musambira', N'Karengera', N'Nyarusange', 1, 3)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (5, N'zigamaGroup', N'Amajyepfo', N'Kamonyi', N'Musambira', N'Mpushi', N'Kamashashi', 1, 1)
SET IDENTITY_INSERT [dbo].[ikimina_locations] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_rounds] ON 

INSERT [dbo].[ikimina_rounds] ([round_id], [iki_id], [round_number], [round_year], [start_date], [end_date], [round_status], [number_of_categories]) VALUES (2, 3, 1, 2025, CAST(N'2025-08-05' AS Date), CAST(N'2026-07-05' AS Date), N'upcoming', 12)
INSERT [dbo].[ikimina_rounds] ([round_id], [iki_id], [round_number], [round_year], [start_date], [end_date], [round_status], [number_of_categories]) VALUES (3, 3, 2, 2026, CAST(N'2026-08-05' AS Date), CAST(N'2027-07-05' AS Date), N'upcoming', 12)
INSERT [dbo].[ikimina_rounds] ([round_id], [iki_id], [round_number], [round_year], [start_date], [end_date], [round_status], [number_of_categories]) VALUES (4, 1, 1, 2025, CAST(N'2025-07-22' AS Date), CAST(N'2025-07-31' AS Date), N'active', 10)
SET IDENTITY_INSERT [dbo].[ikimina_rounds] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_saving_rules] ON 

INSERT [dbo].[ikimina_saving_rules] ([rule_id], [iki_id], [round_id], [saving_ratio], [time_delay_penalty], [date_delay_penalty], [time_limit_minutes], [created_at], [interest_rate_percent]) VALUES (1, 3, 2, CAST(10000.00 AS Decimal(12, 2)), CAST(500.00 AS Decimal(12, 2)), CAST(500.00 AS Decimal(12, 2)), 180, CAST(N'2025-07-22T20:31:03.070' AS DateTime), CAST(10.00 AS Decimal(5, 2)))
INSERT [dbo].[ikimina_saving_rules] ([rule_id], [iki_id], [round_id], [saving_ratio], [time_delay_penalty], [date_delay_penalty], [time_limit_minutes], [created_at], [interest_rate_percent]) VALUES (2, 1, 4, CAST(1000.00 AS Decimal(12, 2)), CAST(100.00 AS Decimal(12, 2)), CAST(50.00 AS Decimal(12, 2)), 60, CAST(N'2025-07-22T20:50:44.157' AS DateTime), CAST(10.00 AS Decimal(5, 2)))
SET IDENTITY_INSERT [dbo].[ikimina_saving_rules] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_saving_slots] ON 

INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (1, 3, CAST(N'2025-08-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (2, 3, CAST(N'2025-09-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (3, 3, CAST(N'2025-10-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (4, 3, CAST(N'2025-11-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (5, 3, CAST(N'2025-12-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (6, 3, CAST(N'2026-01-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (7, 3, CAST(N'2026-02-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (8, 3, CAST(N'2026-03-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (9, 3, CAST(N'2026-04-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (10, 3, CAST(N'2026-05-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (11, 3, CAST(N'2026-06-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (12, 3, CAST(N'2026-07-05' AS Date), CAST(N'10:00:00' AS Time), N'Monthly', N'upcoming', CAST(N'2025-07-22T20:30:18.487' AS DateTime), 2)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (13, 1, CAST(N'2025-07-22' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'passed', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (14, 1, CAST(N'2025-07-23' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'passed', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (15, 1, CAST(N'2025-07-24' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'pending', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (16, 1, CAST(N'2025-07-25' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (17, 1, CAST(N'2025-07-26' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (18, 1, CAST(N'2025-07-27' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (19, 1, CAST(N'2025-07-28' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (20, 1, CAST(N'2025-07-29' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (21, 1, CAST(N'2025-07-30' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
INSERT [dbo].[ikimina_saving_slots] ([slot_id], [iki_id], [slot_date], [slot_time], [frequency_category], [slot_status], [created_at], [round_id]) VALUES (22, 1, CAST(N'2025-07-31' AS Date), CAST(N'17:30:00' AS Time), N'Daily', N'upcoming', CAST(N'2025-07-22T20:50:08.217' AS DateTime), 4)
SET IDENTITY_INSERT [dbo].[ikimina_saving_slots] OFF
GO
SET IDENTITY_INSERT [dbo].[loan_balance_history] ON 

INSERT [dbo].[loan_balance_history] ([history_id], [loan_id], [remaining_balance], [interest_added], [interest_applied_date], [created_at]) VALUES (1, 4, CAST(150000.00 AS Decimal(9, 2)), CAST(15000.00 AS Decimal(9, 2)), CAST(N'2025-07-24T16:21:11.407' AS DateTime), CAST(N'2025-07-24T18:21:11.437' AS DateTime))
INSERT [dbo].[loan_balance_history] ([history_id], [loan_id], [remaining_balance], [interest_added], [interest_applied_date], [created_at]) VALUES (2, 5, CAST(150000.00 AS Decimal(9, 2)), CAST(15000.00 AS Decimal(9, 2)), CAST(N'2025-07-24T16:26:49.230' AS DateTime), CAST(N'2025-07-24T18:26:49.250' AS DateTime))
INSERT [dbo].[loan_balance_history] ([history_id], [loan_id], [remaining_balance], [interest_added], [interest_applied_date], [created_at]) VALUES (3, 5, CAST(35000.00 AS Decimal(9, 2)), CAST(3500.00 AS Decimal(9, 2)), CAST(N'2025-07-24T16:29:14.007' AS DateTime), CAST(N'2025-07-24T18:29:14.027' AS DateTime))
SET IDENTITY_INSERT [dbo].[loan_balance_history] OFF
GO
SET IDENTITY_INSERT [dbo].[loan_interest] ON 

INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (1, 1, CAST(10.00 AS Decimal(5, 2)), CAST(1900.00 AS Decimal(12, 2)), CAST(N'2025-07-24T13:05:00.407' AS DateTime), CAST(N'2025-08-24T13:05:00.407' AS DateTime), 1, CAST(N'2025-07-24T13:05:36.997' AS DateTime), CAST(N'2025-07-24T13:05:00.430' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (2, 2, CAST(10.00 AS Decimal(5, 2)), CAST(30000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T13:06:49.900' AS DateTime), CAST(N'2025-08-24T13:06:49.900' AS DateTime), 1, CAST(N'2025-07-24T13:20:47.067' AS DateTime), CAST(N'2025-07-24T13:06:49.913' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (3, 3, CAST(10.00 AS Decimal(5, 2)), CAST(30000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T15:12:37.010' AS DateTime), CAST(N'2025-08-24T15:12:37.010' AS DateTime), 1, CAST(N'2025-07-24T15:14:48.833' AS DateTime), CAST(N'2025-07-24T15:12:37.060' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (4, 4, CAST(10.00 AS Decimal(5, 2)), CAST(30000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T16:19:31.557' AS DateTime), CAST(N'2025-08-24T16:19:31.557' AS DateTime), 1, CAST(N'2025-07-24T16:20:17.470' AS DateTime), CAST(N'2025-07-24T16:19:31.603' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (6, 5, CAST(10.00 AS Decimal(5, 2)), CAST(30000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T16:26:18.400' AS DateTime), CAST(N'2025-08-24T16:26:18.400' AS DateTime), 1, CAST(N'2025-07-24T16:26:33.617' AS DateTime), CAST(N'2025-07-24T16:26:18.427' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (7, 5, CAST(10.00 AS Decimal(5, 2)), CAST(15000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T18:26:49.260' AS DateTime), CAST(N'2025-08-24T16:26:49.230' AS DateTime), 1, CAST(N'2025-07-24T16:28:46.293' AS DateTime), CAST(N'2025-07-24T18:26:49.260' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (8, 5, CAST(10.00 AS Decimal(5, 2)), CAST(3500.00 AS Decimal(12, 2)), CAST(N'2025-07-24T18:29:14.033' AS DateTime), CAST(N'2025-08-24T16:29:14.007' AS DateTime), 1, CAST(N'2025-07-24T16:37:53.460' AS DateTime), CAST(N'2025-07-24T18:29:14.033' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (9, 6, CAST(10.00 AS Decimal(5, 2)), CAST(10000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T16:57:42.710' AS DateTime), CAST(N'2025-08-24T16:57:42.710' AS DateTime), 1, CAST(N'2025-07-24T16:58:04.697' AS DateTime), CAST(N'2025-07-24T16:57:42.740' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_interest] ([interest_id], [loan_id], [interest_rate], [interest_amount], [calculated_on_date], [due_date], [is_paid], [paid_date], [created_at], [payment_status], [timing_status]) VALUES (10, 7, CAST(10.00 AS Decimal(5, 2)), CAST(30000.00 AS Decimal(12, 2)), CAST(N'2025-07-24T17:00:13.153' AS DateTime), CAST(N'2025-08-24T17:00:13.153' AS DateTime), 1, CAST(N'2025-07-24T17:00:31.453' AS DateTime), CAST(N'2025-07-24T17:00:13.177' AS DateTime), N'paid', N'on_time')
SET IDENTITY_INSERT [dbo].[loan_interest] OFF
GO
SET IDENTITY_INSERT [dbo].[loan_prediction_data] ON 

INSERT [dbo].[loan_prediction_data] ([id], [member_id], [saving_frequency], [saving_times_per_period], [total_saving_cycles], [completed_saving_cycles], [user_savings_made], [total_current_saving], [ikimina_created_year], [coverd_rounds], [member_round], [recent_loan_payment_status], [saving_status], [has_guardian], [round_id], [member_Join_Year]) VALUES (1, 2, N'1', 1, 10, 3, 3, CAST(605000.00 AS Decimal(18, 2)), 2025, 1, 1, N'0', N'1', 0, 4, 2025)
INSERT [dbo].[loan_prediction_data] ([id], [member_id], [saving_frequency], [saving_times_per_period], [total_saving_cycles], [completed_saving_cycles], [user_savings_made], [total_current_saving], [ikimina_created_year], [coverd_rounds], [member_round], [recent_loan_payment_status], [saving_status], [has_guardian], [round_id], [member_Join_Year]) VALUES (2, 4, N'1', 1, 10, 3, 2, CAST(1065000.00 AS Decimal(18, 2)), 2025, 1, 1, N'3', N'1', 0, 4, 2025)
SET IDENTITY_INSERT [dbo].[loan_prediction_data] OFF
GO
SET IDENTITY_INSERT [dbo].[loan_repayments] ON 

INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (1, 1, 4, CAST(1900.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T13:05:36.997' AS DateTime), 0, CAST(N'2025-07-24T13:05:36.997' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (2, 1, 4, CAST(19000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T13:05:44.283' AS DateTime), 1, CAST(N'2025-07-24T13:05:44.283' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (3, 2, 4, CAST(330000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T13:20:47.067' AS DateTime), 1, CAST(N'2025-07-24T13:20:47.067' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (4, 3, 4, CAST(30000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T15:14:48.833' AS DateTime), 0, CAST(N'2025-07-24T15:14:48.833' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (5, 3, 4, CAST(300000.00 AS Decimal(12, 2)), N'mobile', N'150000', CAST(N'2025-07-24T15:15:51.837' AS DateTime), 1, CAST(N'2025-07-24T15:15:51.837' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (6, 4, 4, CAST(30000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:20:17.470' AS DateTime), 0, CAST(N'2025-07-24T16:20:17.470' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (7, 4, 4, CAST(150000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:21:11.407' AS DateTime), 0, CAST(N'2025-07-24T16:21:11.407' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (8, 4, 4, CAST(150000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:25:38.857' AS DateTime), 1, CAST(N'2025-07-24T16:25:38.857' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (9, 5, 4, CAST(30000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:26:33.617' AS DateTime), 0, CAST(N'2025-07-24T16:26:33.617' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (10, 5, 4, CAST(150000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:26:49.230' AS DateTime), 0, CAST(N'2025-07-24T16:26:49.230' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (11, 5, 4, CAST(15000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:28:46.293' AS DateTime), 0, CAST(N'2025-07-24T16:28:46.293' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (12, 5, 4, CAST(100000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:29:14.007' AS DateTime), 0, CAST(N'2025-07-24T16:29:14.007' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (13, 5, 4, CAST(35000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:37:53.460' AS DateTime), 1, CAST(N'2025-07-24T16:37:53.460' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (14, 6, 4, CAST(10000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:58:04.697' AS DateTime), 0, CAST(N'2025-07-24T16:58:04.697' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (15, 6, 4, CAST(100000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T16:58:29.777' AS DateTime), 1, CAST(N'2025-07-24T16:58:29.777' AS DateTime), N'paid', N'on_time')
INSERT [dbo].[loan_repayments] ([repayment_id], [loan_id], [member_id], [amount_paid], [payment_method], [phone_used], [payment_date], [is_full_payment], [created_at], [payment_status], [timing_status]) VALUES (16, 7, 4, CAST(30000.00 AS Decimal(12, 2)), N'mobile', N'0785310410', CAST(N'2025-07-24T17:00:31.453' AS DateTime), 0, CAST(N'2025-07-24T17:00:31.453' AS DateTime), N'paid', N'on_time')
SET IDENTITY_INSERT [dbo].[loan_repayments] OFF
GO
SET IDENTITY_INSERT [dbo].[loans] ON 

INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (1, 4, 1, CAST(19000.00 AS Decimal(12, 2)), CAST(19000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(20900.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T13:05:00.407' AS DateTime), CAST(N'2025-07-24T13:05:00.407' AS DateTime), NULL, CAST(N'2025-08-24T13:05:00.407' AS DateTime), CAST(N'2025-07-24T13:05:44.283' AS DateTime), NULL, CAST(N'2025-07-24T15:05:00.420' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (2, 4, 1, CAST(300000.00 AS Decimal(12, 2)), CAST(300000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(330000.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T13:06:49.900' AS DateTime), CAST(N'2025-07-24T13:06:49.900' AS DateTime), NULL, CAST(N'2025-08-24T13:06:49.900' AS DateTime), CAST(N'2025-07-24T13:20:47.067' AS DateTime), NULL, CAST(N'2025-07-24T15:06:49.907' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (3, 4, 1, CAST(300000.00 AS Decimal(12, 2)), CAST(300000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(330000.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T15:12:37.010' AS DateTime), CAST(N'2025-07-24T15:12:37.010' AS DateTime), CAST(N'2025-07-24T15:12:37.050' AS DateTime), CAST(N'2025-08-24T15:12:37.010' AS DateTime), CAST(N'2025-07-24T15:15:51.837' AS DateTime), N'0785310410', CAST(N'2025-07-24T17:12:37.040' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (4, 4, 1, CAST(300000.00 AS Decimal(12, 2)), CAST(300000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(330000.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T16:19:31.557' AS DateTime), CAST(N'2025-07-24T16:19:31.557' AS DateTime), CAST(N'2025-07-24T16:19:31.597' AS DateTime), CAST(N'2025-08-24T16:19:31.557' AS DateTime), CAST(N'2025-07-24T16:25:38.857' AS DateTime), N'0785310410', CAST(N'2025-07-24T18:19:31.583' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (5, 4, 1, CAST(300000.00 AS Decimal(12, 2)), CAST(300000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(330000.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T16:26:18.400' AS DateTime), CAST(N'2025-07-24T16:26:18.400' AS DateTime), CAST(N'2025-07-24T16:26:18.420' AS DateTime), CAST(N'2025-08-24T16:26:18.400' AS DateTime), CAST(N'2025-07-24T16:37:53.460' AS DateTime), N'0785310410', CAST(N'2025-07-24T18:26:18.410' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (6, 4, 1, CAST(100000.00 AS Decimal(12, 2)), CAST(100000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(110000.00 AS Decimal(12, 2)), N'repaid', CAST(N'2025-07-24T16:57:42.710' AS DateTime), CAST(N'2025-07-24T16:57:42.710' AS DateTime), CAST(N'2025-07-24T16:57:42.730' AS DateTime), CAST(N'2025-08-24T16:57:42.710' AS DateTime), CAST(N'2025-07-24T16:58:29.777' AS DateTime), N'0785310410', CAST(N'2025-07-24T18:57:42.723' AS DateTime), 4)
INSERT [dbo].[loans] ([loan_id], [member_id], [iki_id], [requested_amount], [approved_amount], [interest_rate], [total_repayable], [status], [request_date], [approval_date], [disbursed_date], [due_date], [repayment_completed_date], [phone_disbursed_to], [created_at], [round_id]) VALUES (7, 4, 1, CAST(300000.00 AS Decimal(12, 2)), CAST(300000.00 AS Decimal(12, 2)), CAST(10.00 AS Decimal(5, 2)), CAST(330000.00 AS Decimal(12, 2)), N'approved', CAST(N'2025-07-24T17:00:13.153' AS DateTime), CAST(N'2025-07-24T17:00:13.153' AS DateTime), CAST(N'2025-07-24T17:00:13.170' AS DateTime), CAST(N'2025-08-24T17:00:13.153' AS DateTime), NULL, N'0785310410', CAST(N'2025-07-24T19:00:13.163' AS DateTime), 4)
SET IDENTITY_INSERT [dbo].[loans] OFF
GO
SET IDENTITY_INSERT [dbo].[member_access_info] ON 

INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (1, 1, N'03001', N'56810')
INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (2, 2, N'01001', N'39056')
INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (3, 3, N'04001', N'36305')
INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (4, 4, N'01002', N'70094')
SET IDENTITY_INSERT [dbo].[member_access_info] OFF
GO
SET IDENTITY_INSERT [dbo].[member_saving_activities] ON 

INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (1, 2, 13, CAST(5000.00 AS Decimal(10, 2)), CAST(N'2025-07-22T18:55:35.803' AS DateTime), CAST(100.00 AS Decimal(10, 2)), 1, N'0781049197', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (2, 2, 14, CAST(200000.00 AS Decimal(10, 2)), CAST(N'2025-07-22T19:33:49.657' AS DateTime), CAST(0.00 AS Decimal(10, 2)), 0, N'0781049197', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (3, 2, 17, CAST(30000.00 AS Decimal(10, 2)), CAST(N'2025-07-22T19:34:04.113' AS DateTime), CAST(0.00 AS Decimal(10, 2)), 0, N'0781049197', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (4, 2, 15, CAST(400000.00 AS Decimal(10, 2)), CAST(N'2025-07-24T05:53:30.850' AS DateTime), CAST(0.00 AS Decimal(10, 2)), 0, N'0781049197', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (5, 2, 16, CAST(500000.00 AS Decimal(10, 2)), CAST(N'2025-07-24T06:55:28.083' AS DateTime), CAST(0.00 AS Decimal(10, 2)), 0, N'0781049197', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (6, 4, 13, CAST(265000.00 AS Decimal(10, 2)), CAST(N'2025-07-24T09:01:08.007' AS DateTime), CAST(50.00 AS Decimal(10, 2)), 1, N'0785310410', NULL)
INSERT [dbo].[member_saving_activities] ([save_id], [member_id], [slot_id], [saved_amount], [saved_at], [penalty_applied], [is_late], [phone_used], [momo_reference_id]) VALUES (7, 4, 15, CAST(800000.00 AS Decimal(10, 2)), CAST(N'2025-07-24T17:01:48.447' AS DateTime), CAST(100.00 AS Decimal(10, 2)), 1, N'0785310410', NULL)
SET IDENTITY_INSERT [dbo].[member_saving_activities] OFF
GO
SET IDENTITY_INSERT [dbo].[member_type_info] ON 

INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (1, N'President', N'Umukuru witsinda')
INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (2, N'Secretaire', N'Umunyamabanga')
INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (3, N'Countable', N'Umubitsi')
INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (4, N'Member', NULL)
SET IDENTITY_INSERT [dbo].[member_type_info] OFF
GO
SET IDENTITY_INSERT [dbo].[members_info] ON 

INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status], [joined_at]) VALUES (1, N'NSENGIMANA Elyse', N'1200080146956278', NULL, N'0781049197', N'elinsengimana@gmail.com', 1, 3, N'waiting', CAST(N'2025-07-22T20:06:58.100' AS DateTime))
INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status], [joined_at]) VALUES (2, N'NSENGIMANA Elyse', N'1200080146956278', NULL, N'0781049197', N'elinsengimana@gmail.com', 1, 1, N'active', CAST(N'2025-07-22T20:46:29.120' AS DateTime))
INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status], [joined_at]) VALUES (3, N'suzana', N'1234567890120454', NULL, N'0785310400', N'uwingabiresolange2000@gmail.com', 1, 4, N'inactive', CAST(N'2025-07-23T10:51:31.610' AS DateTime))
INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status], [joined_at]) VALUES (4, N'Soso UWINGABIRE', N'1234567890123450', NULL, N'0785310410', N'elinsengimana@gmail.com', 2, 1, N'inactive', CAST(N'2025-07-24T08:43:46.427' AS DateTime))
SET IDENTITY_INSERT [dbo].[members_info] OFF
GO
SET IDENTITY_INSERT [dbo].[notification_logs] ON 

INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (0, 1, 2, 1, 13, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-22T20:55:40.407' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (2, 2, 2, 1, 14, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-22T21:33:54.710' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (3, 3, 2, 1, 17, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-22T21:34:09.090' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (4, 4, 2, 1, 15, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-24T07:53:36.233' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (5, 5, 2, 1, 16, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-24T08:55:34.133' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (6, 6, 4, 1, 13, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-24T11:01:12.470' AS DateTime))
INSERT [dbo].[notification_logs] ([id], [save_id], [member_id], [iki_id], [slot_id], [sms_sent], [email_sent], [sms_error], [email_error], [sent_at]) VALUES (7, 7, 4, 1, 15, 0, 1, N'Authenticate', NULL, CAST(N'2025-07-24T19:01:54.130' AS DateTime))
SET IDENTITY_INSERT [dbo].[notification_logs] OFF
GO
SET IDENTITY_INSERT [dbo].[penalty_logs] ON 

INSERT [dbo].[penalty_logs] ([penalty_id], [save_id], [member_id], [iki_id], [slot_id], [penalty_type], [penalty_amount], [rule_time_limit_minutes], [actual_saving_time], [allowed_time_limit], [saving_date], [created_at], [is_paid], [paid_at]) VALUES (0, 1, 2, 1, 13, N'time', CAST(100.00 AS Decimal(10, 2)), 60, CAST(N'18:55:35' AS Time), CAST(N'16:30:00' AS Time), CAST(N'2025-07-22' AS Date), CAST(N'2025-07-22T20:55:35.897' AS DateTime), 1, CAST(N'2025-07-22T20:55:53.720' AS DateTime))
INSERT [dbo].[penalty_logs] ([penalty_id], [save_id], [member_id], [iki_id], [slot_id], [penalty_type], [penalty_amount], [rule_time_limit_minutes], [actual_saving_time], [allowed_time_limit], [saving_date], [created_at], [is_paid], [paid_at]) VALUES (1, 6, 4, 1, 13, N'date', CAST(50.00 AS Decimal(10, 2)), 60, CAST(N'09:01:08' AS Time), CAST(N'16:30:00' AS Time), CAST(N'2025-07-24' AS Date), CAST(N'2025-07-24T11:01:08.090' AS DateTime), 0, NULL)
INSERT [dbo].[penalty_logs] ([penalty_id], [save_id], [member_id], [iki_id], [slot_id], [penalty_type], [penalty_amount], [rule_time_limit_minutes], [actual_saving_time], [allowed_time_limit], [saving_date], [created_at], [is_paid], [paid_at]) VALUES (2, 7, 4, 1, 15, N'time', CAST(100.00 AS Decimal(10, 2)), 60, CAST(N'17:01:48' AS Time), CAST(N'16:30:00' AS Time), CAST(N'2025-07-24' AS Date), CAST(N'2025-07-24T19:01:48.500' AS DateTime), 0, NULL)
SET IDENTITY_INSERT [dbo].[penalty_logs] OFF
GO
SET IDENTITY_INSERT [dbo].[supper_admin] ON 

INSERT [dbo].[supper_admin] ([sad_id], [sad_names], [sad_email], [sad_username], [sad_phone], [sad_loc], [sad_pass]) VALUES (1, N'Solange UWINGABIRE', N'uwingabiresolange2000@gmail.com', N'Usolange', N'0785310415', N'Musambira', N'1234')
SET IDENTITY_INSERT [dbo].[supper_admin] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__gudian_m__4E7E4FD5AE54B472]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[gudian_members] ADD UNIQUE NONCLUSTERED 
(
	[gm_Nid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_gm_Nid]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[gudian_members] ADD  CONSTRAINT [UQ_gm_Nid] UNIQUE NONCLUSTERED 
(
	[gm_Nid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_gm_phonenumber]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[gudian_members] ADD  CONSTRAINT [UQ_gm_phonenumber] UNIQUE NONCLUSTERED 
(
	[gm_phonenumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_ikimina_round]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  CONSTRAINT [UQ_ikimina_round] UNIQUE NONCLUSTERED 
(
	[iki_id] ASC,
	[round_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_IkiminaSlot]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  CONSTRAINT [UQ_IkiminaSlot] UNIQUE NONCLUSTERED 
(
	[iki_id] ASC,
	[slot_date] ASC,
	[slot_time] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_member_round]    Script Date: 7/24/2025 7:05:25 PM ******/
CREATE UNIQUE NONCLUSTERED INDEX [idx_member_round] ON [dbo].[loan_prediction_data]
(
	[member_id] ASC,
	[round_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__member_a__9456E71DFB1F4A1E]    Script Date: 7/24/2025 7:05:25 PM ******/
ALTER TABLE [dbo].[member_access_info] ADD UNIQUE NONCLUSTERED 
(
	[member_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ikimina_info] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  DEFAULT ('future') FOR [slot_status]
GO
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[loan_balance_history] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[loan_interest] ADD  DEFAULT (getdate()) FOR [calculated_on_date]
GO
ALTER TABLE [dbo].[loan_interest] ADD  DEFAULT ((0)) FOR [is_paid]
GO
ALTER TABLE [dbo].[loan_interest] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[loan_interest] ADD  DEFAULT ('pending') FOR [payment_status]
GO
ALTER TABLE [dbo].[loan_repayments] ADD  DEFAULT (getdate()) FOR [payment_date]
GO
ALTER TABLE [dbo].[loan_repayments] ADD  DEFAULT ((0)) FOR [is_full_payment]
GO
ALTER TABLE [dbo].[loan_repayments] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[loan_repayments] ADD  DEFAULT ('pending') FOR [payment_status]
GO
ALTER TABLE [dbo].[loans] ADD  DEFAULT ('pending') FOR [status]
GO
ALTER TABLE [dbo].[loans] ADD  DEFAULT (getdate()) FOR [request_date]
GO
ALTER TABLE [dbo].[loans] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT (getdate()) FOR [saved_at]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT ((0)) FOR [penalty_applied]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT ((0)) FOR [is_late]
GO
ALTER TABLE [dbo].[members_info] ADD  DEFAULT ('inactive') FOR [m_status]
GO
ALTER TABLE [dbo].[members_info] ADD  DEFAULT (getdate()) FOR [joined_at]
GO
ALTER TABLE [dbo].[notification_logs] ADD  DEFAULT (getdate()) FOR [sent_at]
GO
ALTER TABLE [dbo].[penalty_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[penalty_logs] ADD  DEFAULT ((0)) FOR [is_paid]
GO
ALTER TABLE [dbo].[frequency_category_info]  WITH NOCHECK ADD FOREIGN KEY([sad_id])
REFERENCES [dbo].[supper_admin] ([sad_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[gudian_members]  WITH NOCHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ik_daily_time_info]  WITH NOCHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ik_daily_time_info]  WITH NOCHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH NOCHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH NOCHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_weekly_time_info]  WITH NOCHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_weekly_time_info]  WITH NOCHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ikimina_info]  WITH NOCHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_info]  WITH NOCHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ikimina_locations]  WITH NOCHECK ADD FOREIGN KEY([sad_id])
REFERENCES [dbo].[supper_admin] ([sad_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_locations]  WITH NOCHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ikimina_rounds]  WITH NOCHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_saving_rules]  WITH NOCHECK ADD  CONSTRAINT [FK_saving_rules_ikimina] FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
GO
ALTER TABLE [dbo].[ikimina_saving_rules] CHECK CONSTRAINT [FK_saving_rules_ikimina]
GO
ALTER TABLE [dbo].[ikimina_saving_rules]  WITH NOCHECK ADD  CONSTRAINT [FK_saving_rules_round] FOREIGN KEY([round_id])
REFERENCES [dbo].[ikimina_rounds] ([round_id])
GO
ALTER TABLE [dbo].[ikimina_saving_rules] CHECK CONSTRAINT [FK_saving_rules_round]
GO
ALTER TABLE [dbo].[ikimina_saving_slots]  WITH NOCHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_saving_slots]  WITH NOCHECK ADD  CONSTRAINT [FK_SavingSlots_Round] FOREIGN KEY([round_id])
REFERENCES [dbo].[ikimina_rounds] ([round_id])
GO
ALTER TABLE [dbo].[ikimina_saving_slots] CHECK CONSTRAINT [FK_SavingSlots_Round]
GO
ALTER TABLE [dbo].[loan_balance_history]  WITH CHECK ADD  CONSTRAINT [FK_LoanBalanceHistory_Loans] FOREIGN KEY([loan_id])
REFERENCES [dbo].[loans] ([loan_id])
GO
ALTER TABLE [dbo].[loan_balance_history] CHECK CONSTRAINT [FK_LoanBalanceHistory_Loans]
GO
ALTER TABLE [dbo].[loan_prediction_data]  WITH NOCHECK ADD  CONSTRAINT [FK_LoanPrediction_Member] FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[loan_prediction_data] CHECK CONSTRAINT [FK_LoanPrediction_Member]
GO
ALTER TABLE [dbo].[loan_repayments]  WITH NOCHECK ADD  CONSTRAINT [fk_repayments_loan] FOREIGN KEY([loan_id])
REFERENCES [dbo].[loans] ([loan_id])
GO
ALTER TABLE [dbo].[loan_repayments] CHECK CONSTRAINT [fk_repayments_loan]
GO
ALTER TABLE [dbo].[loans]  WITH NOCHECK ADD  CONSTRAINT [fk_loans_ikimina] FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
GO
ALTER TABLE [dbo].[loans] CHECK CONSTRAINT [fk_loans_ikimina]
GO
ALTER TABLE [dbo].[loans]  WITH NOCHECK ADD  CONSTRAINT [fk_loans_member] FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
GO
ALTER TABLE [dbo].[loans] CHECK CONSTRAINT [fk_loans_member]
GO
ALTER TABLE [dbo].[loans]  WITH NOCHECK ADD  CONSTRAINT [fk_loans_round] FOREIGN KEY([round_id])
REFERENCES [dbo].[ikimina_rounds] ([round_id])
GO
ALTER TABLE [dbo].[loans] CHECK CONSTRAINT [fk_loans_round]
GO
ALTER TABLE [dbo].[member_access_info]  WITH NOCHECK ADD FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[member_saving_activities]  WITH NOCHECK ADD FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[member_saving_activities]  WITH NOCHECK ADD FOREIGN KEY([slot_id])
REFERENCES [dbo].[ikimina_saving_slots] ([slot_id])
GO
ALTER TABLE [dbo].[members_info]  WITH NOCHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[members_info]  WITH NOCHECK ADD FOREIGN KEY([member_type_id])
REFERENCES [dbo].[member_type_info] ([member_type_id])
GO
ALTER TABLE [dbo].[notification_logs]  WITH NOCHECK ADD  CONSTRAINT [FK_notification_logs_iki_id] FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
GO
ALTER TABLE [dbo].[notification_logs] CHECK CONSTRAINT [FK_notification_logs_iki_id]
GO
ALTER TABLE [dbo].[notification_logs]  WITH NOCHECK ADD  CONSTRAINT [FK_notification_logs_member_id] FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
GO
ALTER TABLE [dbo].[notification_logs] CHECK CONSTRAINT [FK_notification_logs_member_id]
GO
ALTER TABLE [dbo].[notification_logs]  WITH NOCHECK ADD  CONSTRAINT [FK_notification_logs_save_id] FOREIGN KEY([save_id])
REFERENCES [dbo].[member_saving_activities] ([save_id])
GO
ALTER TABLE [dbo].[notification_logs] CHECK CONSTRAINT [FK_notification_logs_save_id]
GO
ALTER TABLE [dbo].[notification_logs]  WITH NOCHECK ADD  CONSTRAINT [FK_notification_logs_slot_id] FOREIGN KEY([slot_id])
REFERENCES [dbo].[ikimina_saving_slots] ([slot_id])
GO
ALTER TABLE [dbo].[notification_logs] CHECK CONSTRAINT [FK_notification_logs_slot_id]
GO
ALTER TABLE [dbo].[password_resets]  WITH NOCHECK ADD  CONSTRAINT [FK_PasswordReset_Admin] FOREIGN KEY([sad_id])
REFERENCES [dbo].[supper_admin] ([sad_id])
GO
ALTER TABLE [dbo].[password_resets] CHECK CONSTRAINT [FK_PasswordReset_Admin]
GO
ALTER TABLE [dbo].[penalty_logs]  WITH NOCHECK ADD FOREIGN KEY([save_id])
REFERENCES [dbo].[member_saving_activities] ([save_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH NOCHECK ADD CHECK  (([monthlytime_date]>=(1) AND [monthlytime_date]<=(31)))
GO
ALTER TABLE [dbo].[loan_interest]  WITH NOCHECK ADD CHECK  (([payment_status]='failed' OR [payment_status]='paid' OR [payment_status]='partial' OR [payment_status]='pending'))
GO
ALTER TABLE [dbo].[loan_interest]  WITH NOCHECK ADD CHECK  (([timing_status]='late' OR [timing_status]='on_time' OR [timing_status]='early'))
GO
ALTER TABLE [dbo].[loan_repayments]  WITH NOCHECK ADD CHECK  (([payment_status]='failed' OR [payment_status]='paid' OR [payment_status]='partial' OR [payment_status]='pending'))
GO
ALTER TABLE [dbo].[loan_repayments]  WITH NOCHECK ADD CHECK  (([timing_status]='late' OR [timing_status]='on_time' OR [timing_status]='early'))
GO
ALTER TABLE [dbo].[loans]  WITH NOCHECK ADD CHECK  (([status]='defaulted' OR [status]='repaid' OR [status]='disbursed' OR [status]='rejected' OR [status]='approved' OR [status]='pending'))
GO
/****** Object:  StoredProcedure [dbo].[ApplySavingPenalty]    Script Date: 7/24/2025 7:05:25 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ApplySavingPenalty]
    @member_id INT,
    @slot_id INT,
    @saved_amount DECIMAL(10, 2),
    @saved_at DATETIME
AS
BEGIN
    DECLARE 
        @iki_id INT,
        @slot_date DATE,
        @slot_time TIME,
        @rule_time_limit INT,
        @time_limit DATETIME,
        @date_delay_penalty DECIMAL(10,2),
        @time_delay_penalty DECIMAL(10,2),
        @penalty DECIMAL(10,2) = 0,
        @is_late BIT = 0;

    -- Get slot info and ikimina
    SELECT 
        @slot_date = slot_date,
        @slot_time = slot_time,
        @iki_id = iki_id
    FROM ikimina_saving_slots
    WHERE slot_id = @slot_id;

    -- Get saving rules
    SELECT 
        @rule_time_limit = time_limit_minutes,
        @time_delay_penalty = ISNULL(time_delay_penalty, 0),
        @date_delay_penalty = ISNULL(date_delay_penalty, 0)
    FROM ikimina_saving_rules
    WHERE iki_id = @iki_id;

    -- Calculate end of saving period
    SET @time_limit = DATEADD(MINUTE, @rule_time_limit, CAST(CAST(@slot_date AS DATETIME) + CAST(@slot_time AS DATETIME) AS DATETIME));

    -- Apply penalties
    IF CAST(@saved_at AS DATE) > @slot_date
    BEGIN
        SET @penalty = @date_delay_penalty;
        SET @is_late = 1;
    END
    ELSE IF @saved_at > @time_limit
    BEGIN
        SET @penalty = @time_delay_penalty;
        SET @is_late = 1;
    END

    -- Insert saving activity
    INSERT INTO member_saving_activities (member_id, slot_id, saved_amount, saved_at, penalty_applied, is_late)
    VALUES (@member_id, @slot_id, @saved_amount, @saved_at, @penalty, @is_late);
END
GO
USE [master]
GO
ALTER DATABASE [ims_db] SET  READ_WRITE 
GO
