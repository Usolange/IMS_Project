-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 15, 2025 at 09:52 PM
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
(4, 'Daily', 2),
(5, 'Weekly', 2),
(6, 'Monthly', 2);

-- --------------------------------------------------------

--
-- Table structure for table `gudian_members`
--

CREATE TABLE `gudian_members` (
  `gm_id` int(11) NOT NULL,
  `gm_names` varchar(100) NOT NULL,
  `gm_Nid` varchar(20) NOT NULL,
  `gm_phonenumber` varchar(10) NOT NULL,
  `iki_id` int(11) NOT NULL
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
  `numberOfEvents` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `weekly_saving_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`weekly_saving_days`)),
  `monthly_saving_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`monthly_saving_days`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ikimina_info`
--

INSERT INTO `ikimina_info` (`iki_id`, `iki_name`, `iki_email`, `iki_username`, `iki_password`, `iki_location`, `f_id`, `dayOfEvent`, `timeOfEvent`, `numberOfEvents`, `created_at`, `weekly_saving_days`, `monthly_saving_days`) VALUES
(1, 'Tuzamurane', 'tuzamurane@gmail.com', 'tuzamurane', '12345', 1, 2, 'Tuesday, Thursday, Saturday, Sunday', '13:00:00', 4, '2025-07-15 12:45:31', '[\"Tuesday\",\"Thursday\",\"Saturday\", \"Sunday\"]', NULL),
(2, 'Umurava', 'umurava@gmail.com', 'umurava', '12345', 2, 6, '01, 05, 15, 10, 20, 25', '17:00:00', 6, '2025-07-15 21:50:01', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_locations`
--

CREATE TABLE `ikimina_locations` (
  `location_id` int(11) NOT NULL,
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

INSERT INTO `ikimina_locations` (`location_id`, `ikimina_name`, `province`, `district`, `sector`, `cell`, `village`, `sad_id`, `f_id`) VALUES
(1, 'Tuzamurane', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Ntovi', 'Ntovi', 1, 2),
(2, 'Umurava', 'Amajyepfo', 'Kamonyi', 'Musambira', 'Mpushi', 'Kamashashi', 2, 6),
(3, 'NEW Vission', 'Amajyepfo', 'Kamonyi', 'Musambira', 'Buhoro', 'Busasamana', 2, 5),
(4, 'Umurava', 'Iburasirazuba', 'Ngoma', 'Rukumberi', 'Rubago', 'Akabungo', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_rounds`
--

CREATE TABLE `ikimina_rounds` (
  `round_id` int(11) NOT NULL,
  `iki_id` int(11) NOT NULL,
  `round_number` int(11) NOT NULL,
  `cycle_year` year(4) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `round_status` enum('upcoming','active','completed') DEFAULT 'upcoming',
  `number_of_categories` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_saving_rules`
--

CREATE TABLE `ikimina_saving_rules` (
  `rule_id` int(11) NOT NULL,
  `iki_id` int(11) NOT NULL,
  `round_id` int(11) NOT NULL,
  `time_delay_penalty` decimal(10,2) DEFAULT 0.00,
  `date_delay_penalty` decimal(10,2) DEFAULT 0.00,
  `saving_ratio` decimal(10,2) DEFAULT 0.00,
  `saving_time_limit` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ikimina_saving_slots`
--

CREATE TABLE `ikimina_saving_slots` (
  `slot_id` int(11) NOT NULL,
  `iki_id` int(11) NOT NULL,
  `slot_date` date NOT NULL,
  `slot_time` time NOT NULL,
  `slot_status` enum('pending','saved','missed','future') DEFAULT 'future',
  `frequency_category_id` int(11) NOT NULL,
  `cycle_year` year(4) NOT NULL,
  `round_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ik_daily_time_info`
--

CREATE TABLE `ik_daily_time_info` (
  `dtime_id` int(11) NOT NULL,
  `ikimina_name` varchar(20) DEFAULT NULL,
  `dtime_time` time NOT NULL,
  `f_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `location_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_monthly_time_info`
--

INSERT INTO `ik_monthly_time_info` (`monthlytime_id`, `ikimina_name`, `monthlytime_date`, `monthlytime_time`, `f_id`, `location_id`) VALUES
(1, 'Umurava', '01', '17:00:00', 6, 2),
(2, 'Umurava', '05', '17:00:00', 6, 2),
(3, 'Umurava', '15', '17:00:00', 6, 2),
(4, 'Umurava', '10', '17:00:00', 6, 2),
(5, 'Umurava', '20', '17:00:00', 6, 2),
(6, 'Umurava', '25', '17:00:00', 6, 2),
(7, 'Umurava', '05', '16:00:00', 3, 4),
(8, 'Umurava', '10', '16:00:00', 3, 4),
(9, 'Umurava', '20', '16:00:00', 3, 4),
(10, 'Umurava', '15', '16:00:00', 3, 4);

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
  `location_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ik_weekly_time_info`
--

INSERT INTO `ik_weekly_time_info` (`weeklytime_id`, `ikimina_name`, `weeklytime_day`, `weeklytime_time`, `f_id`, `location_id`) VALUES
(1, 'Tuzamurane', 'Tuesday', '13:00:00', 2, 1),
(2, 'Tuzamurane', 'Thursday', '13:00:00', 2, 1),
(3, 'Tuzamurane', 'Saturday', '13:00:00', 2, 1),
(4, 'NEW Vission', 'Monday', '15:00:00', 5, 3),
(5, 'NEW Vission', 'Wednesday', '15:00:00', 5, 3),
(6, 'NEW Vission', 'Friday', '15:00:00', 5, 3),
(7, 'Tuzamurane', 'Sunday', '13:00:00', 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `loan_pridict_data`
--

CREATE TABLE `loan_pridict_data` (
  `loanpredict_id` int(11) NOT NULL,
  `maccess_id` int(11) NOT NULL,
  `SavingTimesPerPeriod` int(11) NOT NULL,
  `TotalSavingCycles` int(11) NOT NULL,
  `CompletedSavingCycles` int(11) NOT NULL,
  `UserSavingsMade` int(11) NOT NULL,
  `TotalCurrentSaving` decimal(15,2) NOT NULL,
  `IkiminaCreatedYear` int(11) NOT NULL,
  `UserJoinedYear` int(11) NOT NULL,
  `Age` int(11) NOT NULL,
  `HasGuardian` tinyint(1) NOT NULL,
  `IsEmployed` tinyint(1) NOT NULL,
  `SavingFrequency` enum('daily','weekly','monthly') NOT NULL,
  `RecentLoanPaymentStatus` enum('Excellent','Better','Good','Bad','Poor') NOT NULL,
  `ModelChoice` enum('Random Forest','XGBoost','Linear Regression') NOT NULL,
  `AllowedLoan` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `member_type` varchar(50) NOT NULL,
  `type_desc` varchar(50) DEFAULT NULL
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
(2, 'Solange UWINGABIRE', 'uwingabiresolange2000@gmail.com', 'Usolange', '0785310415', 'Musambira', '1234');

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
  ADD UNIQUE KEY `gm_Nid` (`gm_Nid`),
  ADD KEY `fk_gudian_ikimina` (`iki_id`);

--
-- Indexes for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  ADD PRIMARY KEY (`iki_id`),
  ADD UNIQUE KEY `iki_username` (`iki_username`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `ikimina_info_ibfk_1` (`iki_location`);

--
-- Indexes for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `fk_user` (`sad_id`),
  ADD KEY `fk_frequency_category` (`f_id`);

--
-- Indexes for table `ikimina_rounds`
--
ALTER TABLE `ikimina_rounds`
  ADD PRIMARY KEY (`round_id`),
  ADD KEY `iki_id` (`iki_id`);

--
-- Indexes for table `ikimina_saving_rules`
--
ALTER TABLE `ikimina_saving_rules`
  ADD PRIMARY KEY (`rule_id`),
  ADD KEY `iki_id` (`iki_id`),
  ADD KEY `round_id` (`round_id`);

--
-- Indexes for table `ikimina_saving_slots`
--
ALTER TABLE `ikimina_saving_slots`
  ADD PRIMARY KEY (`slot_id`),
  ADD KEY `iki_id` (`iki_id`),
  ADD KEY `frequency_category_id` (`frequency_category_id`),
  ADD KEY `round_id` (`round_id`);

--
-- Indexes for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD PRIMARY KEY (`dtime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_daily_location` (`location_id`);

--
-- Indexes for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD PRIMARY KEY (`monthlytime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_monthly_location` (`location_id`);

--
-- Indexes for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD PRIMARY KEY (`weeklytime_id`),
  ADD KEY `f_id` (`f_id`),
  ADD KEY `fk_weekly_location` (`location_id`);

--
-- Indexes for table `loan_pridict_data`
--
ALTER TABLE `loan_pridict_data`
  ADD PRIMARY KEY (`loanpredict_id`),
  ADD KEY `maccess_id` (`maccess_id`);

--
-- Indexes for table `members_info`
--
ALTER TABLE `members_info`
  ADD PRIMARY KEY (`member_id`),
  ADD KEY `fk_members_iki` (`iki_id`),
  ADD KEY `fk_members_type` (`member_type_id`);

--
-- Indexes for table `member_access_info`
--
ALTER TABLE `member_access_info`
  ADD PRIMARY KEY (`maccess_id`),
  ADD UNIQUE KEY `member_code` (`member_code`),
  ADD KEY `idx_member_id` (`member_id`);

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
  MODIFY `iki_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ikimina_rounds`
--
ALTER TABLE `ikimina_rounds`
  MODIFY `round_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ikimina_saving_rules`
--
ALTER TABLE `ikimina_saving_rules`
  MODIFY `rule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ikimina_saving_slots`
--
ALTER TABLE `ikimina_saving_slots`
  MODIFY `slot_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  MODIFY `dtime_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  MODIFY `monthlytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  MODIFY `weeklytime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `loan_pridict_data`
--
ALTER TABLE `loan_pridict_data`
  MODIFY `loanpredict_id` int(11) NOT NULL AUTO_INCREMENT;

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
-- Constraints for table `gudian_members`
--
ALTER TABLE `gudian_members`
  ADD CONSTRAINT `fk_gudian_ikimina` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`) ON DELETE CASCADE;

--
-- Constraints for table `ikimina_info`
--
ALTER TABLE `ikimina_info`
  ADD CONSTRAINT `ikimina_info_ibfk_1` FOREIGN KEY (`iki_location`) REFERENCES `ikimina_locations` (`location_id`),
  ADD CONSTRAINT `ikimina_info_ibfk_2` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ikimina_locations`
--
ALTER TABLE `ikimina_locations`
  ADD CONSTRAINT `fk_frequency_category` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`),
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`sad_id`) REFERENCES `supper_admin` (`sad_id`);

--
-- Constraints for table `ikimina_rounds`
--
ALTER TABLE `ikimina_rounds`
  ADD CONSTRAINT `ikimina_rounds_ibfk_1` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`) ON DELETE CASCADE;

--
-- Constraints for table `ikimina_saving_rules`
--
ALTER TABLE `ikimina_saving_rules`
  ADD CONSTRAINT `ikimina_saving_rules_ibfk_1` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ikimina_saving_rules_ibfk_2` FOREIGN KEY (`round_id`) REFERENCES `ikimina_rounds` (`round_id`) ON DELETE CASCADE;

--
-- Constraints for table `ikimina_saving_slots`
--
ALTER TABLE `ikimina_saving_slots`
  ADD CONSTRAINT `ikimina_saving_slots_ibfk_1` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ikimina_saving_slots_ibfk_2` FOREIGN KEY (`frequency_category_id`) REFERENCES `frequency_category_info` (`f_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ikimina_saving_slots_ibfk_3` FOREIGN KEY (`round_id`) REFERENCES `ikimina_rounds` (`round_id`) ON DELETE CASCADE;

--
-- Constraints for table `ik_daily_time_info`
--
ALTER TABLE `ik_daily_time_info`
  ADD CONSTRAINT `fk_daily_location` FOREIGN KEY (`location_id`) REFERENCES `ikimina_locations` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ik_daily_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_monthly_time_info`
--
ALTER TABLE `ik_monthly_time_info`
  ADD CONSTRAINT `fk_monthly_location` FOREIGN KEY (`location_id`) REFERENCES `ikimina_locations` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ik_monthly_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `ik_weekly_time_info`
--
ALTER TABLE `ik_weekly_time_info`
  ADD CONSTRAINT `fk_weekly_location` FOREIGN KEY (`location_id`) REFERENCES `ikimina_locations` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ik_weekly_time_info_ibfk_1` FOREIGN KEY (`f_id`) REFERENCES `frequency_category_info` (`f_id`);

--
-- Constraints for table `loan_pridict_data`
--
ALTER TABLE `loan_pridict_data`
  ADD CONSTRAINT `loan_pridict_data_ibfk_1` FOREIGN KEY (`maccess_id`) REFERENCES `member_access_info` (`maccess_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `members_info`
--
ALTER TABLE `members_info`
  ADD CONSTRAINT `fk_members_iki` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_members_type` FOREIGN KEY (`member_type_id`) REFERENCES `member_type_info` (`member_type_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `members_info_ibfk_1` FOREIGN KEY (`gm_Nid`) REFERENCES `gudian_members` (`gm_Nid`),
  ADD CONSTRAINT `members_info_ibfk_2` FOREIGN KEY (`member_type_id`) REFERENCES `member_type_info` (`member_type_id`),
  ADD CONSTRAINT `members_info_ibfk_3` FOREIGN KEY (`iki_id`) REFERENCES `ikimina_info` (`iki_id`);

--
-- Constraints for table `member_access_info`
--
ALTER TABLE `member_access_info`
  ADD CONSTRAINT `fk_member_access_member` FOREIGN KEY (`member_id`) REFERENCES `members_info` (`member_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
