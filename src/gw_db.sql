SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `gw_db`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `devlog`
--

CREATE TABLE `devlog` (
  `did` varchar(15) NOT NULL,
  `login` timestamp NOT NULL DEFAULT current_timestamp(),
  `logout` timestamp NOT NULL DEFAULT current_timestamp(),
  `msgin` int(9) NOT NULL,
  `bytin` int(9) NOT NULL,
  `msgout` int(9) NOT NULL,
  `bytout` int(9) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estrutura da tabela `syslog`
--

CREATE TABLE `syslog` (
  `protocol` varchar(16) NOT NULL,
  `devices` int(8) NOT NULL,
  `msgsin` int(8) NOT NULL,
  `msgsout` int(8) NOT NULL,
  `bytsin` int(8) NOT NULL,
  `bytsout` int(8) NOT NULL,
  `bytserr` int(8) NOT NULL,
  `datlog` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Índices para tabela `devlog`
--
ALTER TABLE `devlog`
  ADD PRIMARY KEY (`did`,`login`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
