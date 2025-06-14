-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 14, 2025 at 10:48 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ims_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `frequency_category_info`
--

CREATE TABLE `frequency_category_info` (
  `f_id` int(11) NOT NULL,
  `f_category` varchar(50) NOT NULL,
  `sad_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `frequency_category_info`
--

INSERT INTO `frequency_category_info` (`f_id`, `f_category`, `sad_id`) VALUES
(4, 'Daily', 1),
(6, 'Weekly', 1),
(7, 'Monthly', 1),
(14, 'Daily', 2),
(15, 'Weekly', 2),
(20, 'Monthly', 2),
(21, 'annualy', 1);

-- --------------------------------------------------------

--
-- Table structure for table `gudian_members`
--

CREATE TABLE `gudian_members` (
  `gm_id` int(11) NOT NULL,
  `gm_names` varchar(100) NOT NULL,
  `gm_Nid` varchar(20) NOT NULL,
  `gm_phonenumber` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_info`
--

CREATE TABLE `ikimina_info` (
  `iki_id` int(11) NOT NULL,
  `iki_name` varchar(100) NOT NULL,
  `iki_email` varchar(100) NOT NULL,
  `iki_username` varchar(50) NOT NULL,
  `iki_password` varchar(100) NOT NULL,
  `iki_location` varchar(100) NOT NULL,
  `f_id` int(11) NOT NULL,
  `numberOfEvents` int(11) NOT NULL,
  `dayOfEvent` varchar(20) DEFAULT NULL,
  `timeOfEvent` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_locations`
--

CREATE TABLE `ikimina_locations` (
  `id` int(11) NOT NULL,
  `ikimina_name` varchar(30) DEFAULT NULL,
  `province` varchar(20) DEFAULT NULL,
  `district` varchar(20) DEFAULT NULL,
  `sector` varchar(20) DEFAULT NULL,
  `cell` varchar(20) DEFAULT NULL,
  `village` varchar(20) DEFAULT NULL,
  `sad_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ikimina_locations`
--

INSERT INTO `ikimina_locations` (`id`, `ikimina_name`, `province`, `district`, `sector`, `cell`, `village`, `sad_id`) VALUES
(2, NULL, 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Ntovi', 'Kigese', 1),
(3, NULL, 'Amajyepfjo', 'Kamonyi', 'Musambira', 'Mpushi', 'Kamashashi', 2);

-- --------------------------------------------------------

--
-- Table structure for table `ik_daily_time_info`
--

CREATE TABLE `ik_daily_time_info` (
  `dtime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `dtime_time` time NOT NULL,
  `f_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_daily_time_info`
--

INSERT INTO `ik_daily_time_info` (`dtime_id`, `ikimina_name`, `dtime_time`, `f_id`) VALUES
(1, 'Tuza', '14:30:00', 4),
(2, 'Tga', '16:44:00', 4),
(3, 'Tuzamurane', '18:01:00', 14),
(4, 'IKIM', '22:06:00', 4);

-- --------------------------------------------------------

--
-- Table structure for table `ik_monthly_time_info`
--

CREATE TABLE `ik_monthly_time_info` (
  `monthlytime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `monthlytime_date` varchar(100) NOT NULL,
  `monthlytime_time` time NOT NULL,
  `f_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_monthly_time_info`
--

INSERT INTO `ik_monthly_time_info` (`monthlytime_id`, `ikimina_name`, `monthlytime_date`, `monthlytime_time`, `f_id`) VALUES
(1, 'KU', '2025-06-09', '18:00:00', 7),
(2, 'jfg', '2025-06-17,2025-06-05', '18:02:00', 7),
(3, 'Terimbere', '1,7,13,20,26,30,31,25', '12:13:00', 7),
(4, 'Tera', '1,15,26,31,30', '19:08:00', 7),
(5, 'hfdk', '1,6,14,19,31', '23:29:00', 7),
(6, 'hjk', '4,9,16,22,29', '22:33:00', 7),
(7, 'Tuzan', '4', '12:34:00', 7),
(8, 'Tuzan', '10', '12:34:00', 7),
(9, 'Tuzan', '17', '12:34:00', 7),
(10, 'Tuzan', '23', '12:34:00', 7),
(11, 'Tuzan', '30', '12:34:00', 7),
(12, 'Tuzan', '4', '12:34:00', 7),
(13, 'Tuzan', '10', '12:34:00', 7),
(14, 'Tuzan', '17', '12:34:00', 7),
(15, 'Tuzan', '23', '12:34:00', 7),
(16, 'Tuzan', '30', '12:34:00', 7),
(17, 'Tuzan', '26', '12:34:00', 7),
(18, 'sps', '2', '13:41:00', 20),
(19, 'sps', '9', '13:41:00', 20),
(20, 'sps', '14', '13:41:00', 20),
(21, 'sps', '17', '13:41:00', 20),
(22, 'sps', '22', '13:41:00', 20),
(23, 'sps', '28', '13:41:00', 20);

-- --------------------------------------------------------

--
-- Table structure for table `ik_weekly_time_info`
--

CREATE TABLE `ik_weekly_time_info` (
  `weeklytime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `weeklytime_day` varchar(60) NOT NULL,
  `weeklytime_time` time NOT NULL,
  `f_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_weekly_time_info`
--

INSERT INTO `ik_weekly_time_info` (`weeklytime_id`, `ikimina_name`, `weeklytime_day`, `weeklytime_time`, `f_id`) VALUES
(1, 'Tuzamurane', 'Monday', '21:01:00', 15),
(2, 'Tuzamurane', 'Saturday', '21:01:00', 15),
(3, 'Terimbere', 'Monday', '13:05:00', 15),
(4, 'Terimbere', 'Tuesday', '13:05:00', 15),
(5, 'Terimbere', 'Wednesday', '13:05:00', 15),
(6, 'Terimbere', 'Friday', '13:05:00', 15),
(7, 'Terimbere', 'Thursday', '13:05:00', 15),
(8, 'Terimbere', 'Sunday', '13:05:00', 15),
(9, 'soso', 'Wednesday', '13:44:00', 15),
(10, 'soso', 'Saturday', '13:44:00', 15),
(11, 'soso', 'Tuesday', '13:44:00', 15);

-- --------------------------------------------------------

--
-- Table structure for table `members_info`
--

CREATE TABLE `members_info` (
  `member_id` int(11) NOT NULL,
  `member_names` varchar(100) NOT NULL,
  `member_Nid` varchar(20) DEFAULT NULL,
  `gm_Nid` varchar(20) DEFAULT NULL,
  `member_phone_number` varchar(10) NOT NULL,
  `member_email` varchar(100) DEFAULT NULL,
  `member_type_id` int(11) NOT NULL,
  `iki_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `member_access_info`
--

CREATE TABLE `member_access_info` (
  `maccess_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `member_code` char(5) NOT NULL,
  `member_pass` char(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `member_type_info`
--

CREATE TABLE `member_type_info` (
  `member_type_id` int(11) NOT NULL,
  `member_type` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supper_admin`
--

CREATE TABLE `supper_admin` (
  `sad_id` int(11) NOT NULL,
  `sad_names` varchar(100) NOT NULL,
  `sad_email` varchar(100) NOT NULL,
  `sad_username` varchar(50) NOT NULL,
  `sad_phone` varchar(10) NOT NULL,
  `sad_loc` varchar(20) DEFAULT NULL,
  `sad_pass` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supper_admin`
--

INSERT INTO `supper_admin` (`sad_id`, `sad_names`, `sad_email`, `sad_username`, `sad_phone`, `sad_loc`, `sad_pass`) VALUES
(1, 'Elyse NSENGIMANA', 'elinsengimana@gmail.com', 'nelyse', '0781049197', 'Rukumberi', '123'),
(2, 'Solange UWINGABIRE', 'uwingabiresolange2000@gmail.com', 'Usolange', '0781049790', 'Musambira', '123');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `frequency_category_info`
--
ALTER TABLE `frequency_category_info`
  ADD PRIMARY KEY (`f_id`),
  ADD KEY `sad_id` (`sad_id`);

--
-- Indexes for table `gudian_members`
--
ALTER TABLE `gudian_members`
  ADD PRIMARY KEY (`gm_id`),
  ADD UNIQUE KEY `gm_Nid` (`gm_Nid`);

--
-- Indexes for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  ADD PRIMARY KEY (`iki_id`),
  ADD UNIQUE KEY `iki_email` (`iki_email`),
  ADD UNIQUE KEY `iki_username` (`iki_username`),
  ADD KEY `f_id` (`f_id`);

--
-- Indexes for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`sad_id`);

--
-- Indexes for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD PRIMARY KEY (`dtime_id`),
  ADD KEY `f_id` (`f_id`);

--
-- Indexes for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD PRIMARY KEY (`monthlytime_id`),
  ADD KEY `f_id` (`f_id`);

--
-- Indexes for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD PRIMARY KEY (`weeklytime_id`),
  ADD KEY `f_id` (`f_id`);

--
-- Indexes for table `members_info`
--
ALTER TABLE `members_info`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `member_phone_number` (`member_phone_number`),
  ADD KEY `gm_Nid` (`gm_Nid`),
  ADD KEY `member_type_id` (`member_type_id`),
  ADD KEY `iki_id` (`iki_id`);

--
-- Indexes for table `member_access_info`
--
ALTER TABLE `member_access_info`
  ADD PRIMARY KEY (`maccess_id`),
  ADD UNIQUE KEY `member_code` (`member_code`),
  ADD KEY `member_id` (`member_id`);

--
-- Indexes for table `member_type_info`
--
ALTER TABLE `member_type_info`
  ADD PRIMARY KEY (`member_type_id`),
  ADD UNIQUE KEY `member_type` (`member_type`);

--
-- Indexes for table `supper_admin`
--
ALTER TABLE `supper_admin`
  ADD PRIMARY KEY (`sad_id`),
  ADD UNIQUE KEY `sad_email` (`sad_email`),
  ADD UNIQUE KEY `sad_username` (`sad_username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `frequency_category_info`
--
ALTER TABLE `frequency_category_info`
  MODIFY `f_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `gudian_members`
--
ALTER TABLE `gudian_members`
  MODIFY `gm_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  MODIFY `iki_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  MODIFY `dtime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  MODIFY `monthlytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  MODIFY `weeklytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `members_info`
--
ALTER TABLE `members_info`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `member_access_info`
--
ALTER TABLE `member_access_info`
  MODIFY `maccess_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `member_type_info`
--
ALTER TABLE `member_type_info`
  MODIFY `member_type_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supper_admin`
--
ALTER TABLE `supper_admin`
  MODIFY `sad_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `frequency_category_info`
--
ALTER TABLE `frequency_category_info`
  ADD CONSTRAINT `frequency_category_info_ibfk_1` FOREIGN KEY (`sad_id`) REFERENCES `supper_admin` (`sad_id`);

--
-- Constraints for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  ADD CONSTRAINT `ikimina_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`sad_id`) REFERENCES `supper_admin` (`sad_id`);

--
-- Constraints for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD CONSTRAINT `ik_daily_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD CONSTRAINT `ik_monthly_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD CONSTRAINT `ik_weekly_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `members_info`
--
ALTER TABLE `members_info`
  ADD CONSTRAINT `members_info_ibfk_1` FOREIGN KEY (`gm_Nid`) REFERENCES `gudian_members` (`gm_Nid`),
  ADD CONSTRAINT `members_info_ibfk_2` FOREIGN KEY (`member_type_id`) REFERENCES `member_type_info` (`member_type_id`),
  ADD CONSTRAINT `members_info_ibfk_3` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`);

--
-- Constraints for table `member_access_info`
--
ALTER TABLE `member_access_info`
  ADD CONSTRAINT `member_access_info_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members_info` (`member_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
