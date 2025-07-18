USE [master]
GO
/****** Object:  Database [ims_db]    Script Date: 7/17/2025 10:34:20 PM ******/
CREATE DATABASE [ims_db]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'ims_db', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\ims_db.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
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
/****** Object:  Table [dbo].[frequency_category_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[gudian_members]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ik_daily_time_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ik_monthly_time_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ik_weekly_time_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ikimina_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
	[m_status] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[iki_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_locations]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ikimina_rounds]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[ikimina_saving_rules]    Script Date: 7/17/2025 10:34:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ikimina_saving_rules](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[iki_id] [int] NOT NULL,
	[saving_ratio] [decimal](10, 2) NULL,
	[time_delay_penalty] [decimal](10, 2) NULL,
	[date_delay_penalty] [decimal](10, 2) NULL,
	[time_limit_minutes] [int] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ikimina_saving_slots]    Script Date: 7/17/2025 10:34:20 PM ******/
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
PRIMARY KEY CLUSTERED 
(
	[slot_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[member_access_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[member_saving_activities]    Script Date: 7/17/2025 10:34:20 PM ******/
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
PRIMARY KEY CLUSTERED 
(
	[save_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[member_type_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
/****** Object:  Table [dbo].[members_info]    Script Date: 7/17/2025 10:34:20 PM ******/
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
PRIMARY KEY CLUSTERED 
(
	[member_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[supper_admin]    Script Date: 7/17/2025 10:34:20 PM ******/
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
INSERT [dbo].[frequency_category_info] ([f_id], [f_category], [sad_id]) VALUES (3, N'Weekly', 1)
INSERT [dbo].[frequency_category_info] ([f_id], [f_category], [sad_id]) VALUES (4, N'Monthly', 1)
SET IDENTITY_INSERT [dbo].[frequency_category_info] OFF
GO
SET IDENTITY_INSERT [dbo].[gudian_members] ON 

INSERT [dbo].[gudian_members] ([gm_id], [gm_names], [gm_Nid], [gm_phonenumber], [iki_id]) VALUES (2, N'HARERIMANA Alphonse', N'1196680056500008', N'0787439190', 3)
SET IDENTITY_INSERT [dbo].[gudian_members] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_daily_time_info] ON 

INSERT [dbo].[ik_daily_time_info] ([dtime_id], [ikimina_name], [dtime_time], [f_id], [location_id]) VALUES (1, N'Tuzamurane', CAST(N'19:00:00' AS Time), 1, 1)
SET IDENTITY_INSERT [dbo].[ik_daily_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_monthly_time_info] ON 

INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (2, N'NEW Vission', 1, CAST(N'16:00:00' AS Time), 4, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (3, N'NEW Vission', 5, CAST(N'16:00:00' AS Time), 4, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (4, N'NEW Vission', 10, CAST(N'16:00:00' AS Time), 4, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (5, N'NEW Vission', 15, CAST(N'16:00:00' AS Time), 4, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (6, N'NEW Vission', 20, CAST(N'16:00:00' AS Time), 4, 3)
INSERT [dbo].[ik_monthly_time_info] ([monthlytime_id], [ikimina_name], [monthlytime_date], [monthlytime_time], [f_id], [location_id]) VALUES (7, N'NEW Vission', 25, CAST(N'16:00:00' AS Time), 4, 3)
SET IDENTITY_INSERT [dbo].[ik_monthly_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ik_weekly_time_info] ON 

INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (1, N'Umurava', N'Monday', CAST(N'15:30:00' AS Time), 3, 2)
INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (2, N'Umurava', N'Wednesday', CAST(N'15:30:00' AS Time), 3, 2)
INSERT [dbo].[ik_weekly_time_info] ([weeklytime_id], [ikimina_name], [weeklytime_day], [weeklytime_time], [f_id], [location_id]) VALUES (3, N'Umurava', N'Saturday', CAST(N'15:30:00' AS Time), 3, 2)
SET IDENTITY_INSERT [dbo].[ik_weekly_time_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_info] ON 

INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at], [m_status]) VALUES (1, N'Tuzamurane', N'tuzamurane@gmail.com', N'tuzamurane', N'12345', 1, 1, N'Daily', CAST(N'19:00:00' AS Time), 1, NULL, NULL, CAST(N'2025-07-17T19:52:08.917' AS DateTime), NULL)
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at], [m_status]) VALUES (2, N'NEW Vission', N'newvission@gmail.com', N'newvission', N'12345', 3, 4, N'1, 5, 10, 15, 20, 25', CAST(N'16:00:00' AS Time), 6, NULL, N'[1,5,10,15,20,25]', CAST(N'2025-07-17T20:05:24.423' AS DateTime), NULL)
INSERT [dbo].[ikimina_info] ([iki_id], [iki_name], [iki_email], [iki_username], [iki_password], [location_id], [f_id], [dayOfEvent], [timeOfEvent], [numberOfEvents], [weekly_saving_days], [monthly_saving_days], [created_at], [m_status]) VALUES (3, N'Umurava', N'umurava@gmail.com', N'umurava', N'12345', 2, 3, N'Monday, Wednesday, Saturday', CAST(N'15:30:00' AS Time), 3, N'["Monday","Wednesday","Saturday"]', NULL, CAST(N'2025-07-17T20:09:45.340' AS DateTime), NULL)
SET IDENTITY_INSERT [dbo].[ikimina_info] OFF
GO
SET IDENTITY_INSERT [dbo].[ikimina_locations] ON 

INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (1, N'Tuzamurane', N'Iburasirazuba', N'Ngoma', N'Rukumberi', N'Ntovi', N'Kigese', 1, 1)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (2, N'Umurava', N'Iburasirazuba', N'Ngoma', N'Rukumberi', N'Gituza', N'Mfune', 1, 3)
INSERT [dbo].[ikimina_locations] ([location_id], [ikimina_name], [province], [district], [sector], [cell], [village], [sad_id], [f_id]) VALUES (3, N'NEW Vission', N'Iburasirazuba', N'Ngoma', N'Rukumberi', N'Rwintashya', N'Bare', 1, 4)
SET IDENTITY_INSERT [dbo].[ikimina_locations] OFF
GO
SET IDENTITY_INSERT [dbo].[member_access_info] ON 

INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (4, 4, N'03003', N'85451')
INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (5, 5, N'03004', N'40708')
INSERT [dbo].[member_access_info] ([maccess_id], [member_id], [member_code], [member_pass]) VALUES (6, 6, N'03005', N'34505')
SET IDENTITY_INSERT [dbo].[member_access_info] OFF
GO
SET IDENTITY_INSERT [dbo].[member_type_info] ON 

INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (1, N'President', N'Umukuru witsinda')
INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (2, N'Secretaire', N'Umunyamabanga')
INSERT [dbo].[member_type_info] ([member_type_id], [member_type], [type_desc]) VALUES (3, N'Contable', NULL)
SET IDENTITY_INSERT [dbo].[member_type_info] OFF
GO
SET IDENTITY_INSERT [dbo].[members_info] ON 

INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status]) VALUES (4, N'Landry MPAYIMANA CYIZA', N'1234567890123450', NULL, N'0788310415', N'uwingabiresolange2000@gmail.com', 1, 3, N'inactive')
INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status]) VALUES (5, N'Elyse NSENGIMANA', NULL, N'1196680056500008', N'0785310419', N'uwingabiresolange2000@gmail.com', 2, 3, N'inactive')
INSERT [dbo].[members_info] ([member_id], [member_names], [member_Nid], [gm_Nid], [member_phone_number], [member_email], [member_type_id], [iki_id], [m_status]) VALUES (6, N'Solange UWINGABIRE', NULL, N'1196680056500008', N'0785310410', N'uwingabiresolange2000@gmail.com', 3, 3, N'inactive')
SET IDENTITY_INSERT [dbo].[members_info] OFF
GO
SET IDENTITY_INSERT [dbo].[supper_admin] ON 

INSERT [dbo].[supper_admin] ([sad_id], [sad_names], [sad_email], [sad_username], [sad_phone], [sad_loc], [sad_pass]) VALUES (1, N'Elyse NSENGIMANA', N'elinsengimana@gmail.com', N'nelyse', N'0781049197', N'Rukumberi', N'1234')
SET IDENTITY_INSERT [dbo].[supper_admin] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__gudian_m__4E7E4FD567FE1BC0]    Script Date: 7/17/2025 10:34:20 PM ******/
ALTER TABLE [dbo].[gudian_members] ADD UNIQUE NONCLUSTERED 
(
	[gm_Nid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_IkiminaSlot]    Script Date: 7/17/2025 10:34:20 PM ******/
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  CONSTRAINT [UQ_IkiminaSlot] UNIQUE NONCLUSTERED 
(
	[iki_id] ASC,
	[slot_date] ASC,
	[slot_time] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__member_a__9456E71DB86BBF0C]    Script Date: 7/17/2025 10:34:20 PM ******/
ALTER TABLE [dbo].[member_access_info] ADD UNIQUE NONCLUSTERED 
(
	[member_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__members___7A014C44C2A761C0]    Script Date: 7/17/2025 10:34:20 PM ******/
ALTER TABLE [dbo].[members_info] ADD UNIQUE NONCLUSTERED 
(
	[member_phone_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ikimina_info] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT ((0)) FOR [saving_ratio]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT ((0)) FOR [time_delay_penalty]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT ((0)) FOR [date_delay_penalty]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT ((0)) FOR [time_limit_minutes]
GO
ALTER TABLE [dbo].[ikimina_saving_rules] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  DEFAULT ('future') FOR [slot_status]
GO
ALTER TABLE [dbo].[ikimina_saving_slots] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT (getdate()) FOR [saved_at]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT ((0)) FOR [penalty_applied]
GO
ALTER TABLE [dbo].[member_saving_activities] ADD  DEFAULT ((0)) FOR [is_late]
GO
ALTER TABLE [dbo].[members_info] ADD  DEFAULT ('inactive') FOR [m_status]
GO
ALTER TABLE [dbo].[frequency_category_info]  WITH CHECK ADD FOREIGN KEY([sad_id])
REFERENCES [dbo].[supper_admin] ([sad_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[gudian_members]  WITH CHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ik_daily_time_info]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ik_daily_time_info]  WITH CHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH CHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_weekly_time_info]  WITH CHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ik_weekly_time_info]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
GO
ALTER TABLE [dbo].[ikimina_info]  WITH CHECK ADD FOREIGN KEY([location_id])
REFERENCES [dbo].[ikimina_locations] ([location_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_info]  WITH CHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ikimina_locations]  WITH CHECK ADD FOREIGN KEY([sad_id])
REFERENCES [dbo].[supper_admin] ([sad_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_locations]  WITH CHECK ADD FOREIGN KEY([f_id])
REFERENCES [dbo].[frequency_category_info] ([f_id])
GO
ALTER TABLE [dbo].[ikimina_rounds]  WITH CHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_saving_rules]  WITH CHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ikimina_saving_slots]  WITH CHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[member_access_info]  WITH CHECK ADD FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[member_saving_activities]  WITH CHECK ADD FOREIGN KEY([member_id])
REFERENCES [dbo].[members_info] ([member_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[member_saving_activities]  WITH CHECK ADD FOREIGN KEY([slot_id])
REFERENCES [dbo].[ikimina_saving_slots] ([slot_id])
GO
ALTER TABLE [dbo].[members_info]  WITH CHECK ADD FOREIGN KEY([iki_id])
REFERENCES [dbo].[ikimina_info] ([iki_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[members_info]  WITH CHECK ADD FOREIGN KEY([member_type_id])
REFERENCES [dbo].[member_type_info] ([member_type_id])
GO
ALTER TABLE [dbo].[ik_monthly_time_info]  WITH CHECK ADD CHECK  (([monthlytime_date]>=(1) AND [monthlytime_date]<=(31)))
GO
USE [master]
GO
ALTER DATABASE [ims_db] SET  READ_WRITE 
GO
