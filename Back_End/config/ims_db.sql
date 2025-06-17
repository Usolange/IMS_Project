-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2025 at 06:55 PM
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
(1, 'Daily', 1),
(2, 'Weekly', 1),
(3, 'Monthly', 1),
(4, 'Daily', 9),
(5, 'Weekly', 9),
(6, 'Monthly', 9);

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
  `iki_name` varchar(20) NOT NULL,
  `iki_email` varchar(50) NOT NULL,
  `iki_username` varchar(20) NOT NULL,
  `iki_password` varchar(10) NOT NULL,
  `iki_location` int(11) NOT NULL,
  `f_id` int(11) NOT NULL,
  `dayOfEvent` varchar(60) NOT NULL,
  `timeOfEvent` time NOT NULL,
  `numberOfEvents` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ikimina_info`
--

INSERT INTO `ikimina_info` (`iki_id`, `iki_name`, `iki_email`, `iki_username`, `iki_password`, `iki_location`, `f_id`, `dayOfEvent`, `timeOfEvent`, `numberOfEvents`) VALUES
(1, 'Tuzamurane', 'tuzamurane@gmail.com', 'tuzamurane', '12345', 6, 4, 'Daily', '18:00:00', 1),
(2, 'Umurava', 'umurava@gmail.com', 'umurava', '12345', 7, 5, 'Monday, Friday, Wednesday, Sunday', '19:00:00', 4),
(3, 'Tuzamurane', 'umurava123@gmail.com', 'umura', '12345', 2, 2, 'N/A', '00:00:00', 0),
(4, 'Umurava', 'umu@gmai.com', 'uy', '12345', 4, 3, '01, 02, 03, 07, 12, 08, 15, 22, 24, 26', '19:08:00', 10);

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_locations`
--

CREATE TABLE `ikimina_locations` (
  `id` int(11) NOT NULL,
  `ikimina_id` int(11) NOT NULL,
  `ikimina_name` varchar(30) DEFAULT NULL,
  `province` varchar(20) DEFAULT NULL,
  `district` varchar(20) DEFAULT NULL,
  `sector` varchar(20) DEFAULT NULL,
  `cell` varchar(20) DEFAULT NULL,
  `village` varchar(20) DEFAULT NULL,
  `sad_id` int(11) NOT NULL,
  `f_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ikimina_locations`
--

INSERT INTO `ikimina_locations` (`id`, `ikimina_id`, `ikimina_name`, `province`, `district`, `sector`, `cell`, `village`, `sad_id`, `f_id`) VALUES
(1, 1, 'Tuzamurane', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Ntovi', 'Kigese', 1, 1),
(2, 2, 'Tuzamurane', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Rwintashya', 'Bare', 1, 2),
(4, 3, 'Umurava', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Gituza', 'Gitesanyi', 1, 3),
(5, 4, 'Umurava', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Rubona', 'Ruyenzi I', 1, 1),
(6, 5, 'Tuzamurane', 'Amajyepfo', 'Kamonyi', 'Musambira', 'Mpushi', 'Kamashashi', 9, 4),
(7, 6, 'Umurava', 'Amajyepfo', 'Kamonyi', 'Musambira', 'Kivumu', 'Gitega', 9, 5),
(8, 7, 'NEW Vission', 'Amajyepfo', 'Kamonyi', 'Musambira', 'Mpushi', 'Kamashashi', 9, 6);

-- --------------------------------------------------------

--
-- Table structure for table `ik_daily_time_info`
--

CREATE TABLE `ik_daily_time_info` (
  `dtime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `dtime_time` time NOT NULL,
  `f_id` int(11) NOT NULL,
  `ikimina_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_daily_time_info`
--

INSERT INTO `ik_daily_time_info` (`dtime_id`, `ikimina_name`, `dtime_time`, `f_id`, `ikimina_id`) VALUES
(1, 'Tuzamurane', '22:51:00', 1, 1),
(2, 'Umurava', '23:53:00', 1, 4),
(3, 'Tuzamurane', '18:00:00', 4, 5);

-- --------------------------------------------------------

--
-- Table structure for table `ik_monthly_time_info`
--

CREATE TABLE `ik_monthly_time_info` (
  `monthlytime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `monthlytime_date` varchar(100) NOT NULL,
  `monthlytime_time` time NOT NULL,
  `f_id` int(11) NOT NULL,
  `ikimina_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_monthly_time_info`
--

INSERT INTO `ik_monthly_time_info` (`monthlytime_id`, `ikimina_name`, `monthlytime_date`, `monthlytime_time`, `f_id`, `ikimina_id`) VALUES
(1, 'Umurava', '01', '19:08:00', 3, 3),
(2, 'Umurava', '02', '19:08:00', 3, 3),
(3, 'Umurava', '03', '19:08:00', 3, 3),
(4, 'Umurava', '07', '19:08:00', 3, 3),
(5, 'Umurava', '12', '19:08:00', 3, 3),
(6, 'Umurava', '08', '19:08:00', 3, 3),
(7, 'Umurava', '15', '19:08:00', 3, 3),
(8, 'Umurava', '22', '19:08:00', 3, 3),
(9, 'Umurava', '24', '19:08:00', 3, 3),
(10, 'Umurava', '26', '19:08:00', 3, 3),
(11, 'NEW Vission', '05', '20:00:00', 6, 7),
(12, 'NEW Vission', '01', '20:00:00', 6, 7),
(13, 'NEW Vission', '10', '20:00:00', 6, 7),
(14, 'NEW Vission', '15', '20:00:00', 6, 7),
(15, 'NEW Vission', '30', '20:00:00', 6, 7),
(16, 'NEW Vission', '25', '20:00:00', 6, 7),
(17, 'NEW Vission', '20', '20:00:00', 6, 7);

-- --------------------------------------------------------

--
-- Table structure for table `ik_weekly_time_info`
--

CREATE TABLE `ik_weekly_time_info` (
  `weeklytime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `weeklytime_day` varchar(60) NOT NULL,
  `weeklytime_time` time NOT NULL,
  `f_id` int(11) NOT NULL,
  `ikimina_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_weekly_time_info`
--

INSERT INTO `ik_weekly_time_info` (`weeklytime_id`, `ikimina_name`, `weeklytime_day`, `weeklytime_time`, `f_id`, `ikimina_id`) VALUES
(1, 'Umurava', 'Monday', '19:00:00', 5, 6),
(2, 'Umurava', 'Friday', '19:00:00', 5, 6),
(3, 'Umurava', 'Wednesday', '19:00:00', 5, 6),
(4, 'Umurava', 'Sunday', '19:00:00', 5, 6);

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
(1, 'Elyse NSENGIMANA', 'elinsengimana@gmail.com', 'nelyse', '0781049197', 'Rukumberi', '1234'),
(9, 'Solange UWINGABIRE', 'uwingabiresolange2000@gmail.com', 'Usolange', '0785310415', 'Musambira', '1234');

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
  ADD UNIQUE KEY `iki_username` (`iki_username`),
  ADD KEY `iki_location` (`iki_location`),
  ADD KEY `f_id` (`f_id`);

--
-- Indexes for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ikimina_id` (`ikimina_id`),
  ADD KEY `fk_user` (`sad_id`),
  ADD KEY `fk_frequency_category` (`f_id`);

--
-- Indexes for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD PRIMARY KEY (`dtime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_daily_ikimina` (`ikimina_id`);

--
-- Indexes for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD PRIMARY KEY (`monthlytime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_monthly_ikimina` (`ikimina_id`);

--
-- Indexes for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD PRIMARY KEY (`weeklytime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_weekly_ikimina` (`ikimina_id`);

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
  MODIFY `f_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `gudian_members`
--
ALTER TABLE `gudian_members`
  MODIFY `gm_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  MODIFY `iki_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  MODIFY `dtime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  MODIFY `monthlytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  MODIFY `weeklytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `sad_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
  ADD CONSTRAINT `ikimina_info_ibfk_1` FOREIGN KEY (`iki_location`) REFERENCES `ikimina_locations` (`ikimina_id`),
  ADD CONSTRAINT `ikimina_info_ibfk_2` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD CONSTRAINT `fk_frequency_category` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`),
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`sad_id`) REFERENCES `supper_admin` (`sad_id`);

--
-- Constraints for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD CONSTRAINT `fk_daily_ikimina` FOREIGN KEY (`ikimina_id`) REFERENCES `ikimina_locations` (`ikimina_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ik_daily_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD CONSTRAINT `fk_monthly_ikimina` FOREIGN KEY (`ikimina_id`) REFERENCES `ikimina_locations` (`ikimina_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ik_monthly_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD CONSTRAINT `fk_weekly_ikimina` FOREIGN KEY (`ikimina_id`) REFERENCES `ikimina_locations` (`ikimina_id`) ON DELETE CASCADE ON UPDATE CASCADE,
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
