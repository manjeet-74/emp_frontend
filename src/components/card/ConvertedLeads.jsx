import { useEffect, useState } from "react";
import { Button, Card, CardBody, Flex, Progress, Select } from "@chakra-ui/react";
import axios from "axios";
import { FaTty } from "react-icons/fa6";
import { TfiBarChart } from "react-icons/tfi";
import { IoAlertCircleOutline } from "react-icons/io5";
import { SlDrawer } from "react-icons/sl"
import { Divider } from "antd";
import { allMonths } from "../../helpers";

const ConvertedLeads = () => {
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsInProgress, setLeadsInProgress] = useState(0);
  // const [convertedLeads, setConvertedLeads] = useState(0);
  const [lostLeads, setLostLeads] = useState(0);
  const [rawLeads, setRawLeads] = useState(0);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectQuarterFirstMonth, setSelectQuarterFirstMonth] = useState(null);

  useEffect(() => {
    fetchData();
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, selectedQuarter])

  const fetchFinancialYears = () => {
    try {
      axios.get(`${import.meta.env.VITE_API_BASE}/api/admin/getAllYears`)
        .then((res) => {
          setFinancialYears(res.data);
        });
    } catch (error) {
      console.log(`Error fetching financial years: ${error}`);
    }
  }

  const fetchData = () => {
    // Fetch total lead count
    axios.post(`${import.meta.env.VITE_API_BASE}/api/admin/getTotalLeadCount`, {
      financialYear: selectedYear || "",
      month: selectedMonth || "",
      quarter: selectedQuarter || "",
      firstQuarterMonth: selectQuarterFirstMonth || ""
    })
      .then((response) => {
        // console.log(response.data)
        setTotalLeads(response.data.totalLeadCount);
        fetchLeadsByStatus();
      })
      .catch((error) => {
        console.error("Error fetching total lead count:", error);
      });
  }

  const fetchLeadsByStatus = () => {
    // Fetch leads by status
    axios.get(`${import.meta.env.VITE_API_BASE}/api/admin/getLeadsByStatus`)
      .then((response) => {
        const leads = response.data;
        // console.log(leads)
        const inProgressLead = leads.find((lead) => lead._id === "In-Progress");
        const convertedLead = leads.find((lead) => lead._id === "Client");
        const lostLead = leads.find((lead) => lead._id === "Lost");
        const rawLead = leads.find((lead) => lead._id === "Raw");

        if (inProgressLead) {
          setLeadsInProgress(inProgressLead.count);
        }
        if (convertedLead) {
          // setConvertedLeads(convertedLead.count);
        }
        if (lostLead) {
          setLostLeads(lostLead.count);
        }
        if (rawLead) {
          setRawLeads(rawLead.count);
        }
      })
      .catch((error) => {
        console.error("Error fetching leads by status:", error);
      });
  }

  const handleYearClear = () => {
    setSelectedYear(null);
    setSelectedFilter(null);
    setSelectedMonth(null);
    setSelectQuarterFirstMonth(null);
    setSelectedQuarter(null);
  }

  return (
    <>
      <Card className="w-full md:w-1/3 p-4 pb-8">
        <div className="flex items-center justify-between text-gray-600">
          <h1 className="flex text-xl gap-2 items-center">
            <FaTty /> Leads
          </h1>
          <div className="bg-blue-500 rounded-full h-[25px] min-w-[25px] flex items-center justify-center text-white text-[10px]">{totalLeads}</div>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Select
            placeholder='Select Year'
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(e.target.value)}
            size={"sm"}
            rounded={"lg"}
          >
            {financialYears?.map((year) => (
              <option key={`fy-${year._id}`} value={year.financial_year.split('-')[0]}>{year.financial_year}</option>
            ))}
          </Select>
          <div className="flex gap-2 items-center">
            <Select
              placeholder='Filter by'
              value={selectedFilter || ""}
              onChange={(e) => setSelectedFilter(e.target.value)}
              size={"sm"}
              rounded={"lg"}
            >
              <option value={"month"}>Month</option>
              <option value={"quarter"}>Quarter</option>
            </Select>
            {selectedFilter === "month" && (
              <Select
                placeholder='Select Month'
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size={"sm"}
                rounded={"lg"}
              >
                {selectedYear && allMonths.map((month, index) => (
                  <option key={`m-${month}`} value={index + 1}>{selectedYear}-{month}</option>
                ))}
              </Select>
            )}
            {selectedYear && selectedFilter === "quarter" && (
              <Select
                placeholder='Select Quarter'
                value={selectedQuarter || ""}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                size={"sm"}
                rounded={"lg"}
              >
                <option key={`quarter-1`} value={1}>1 - {selectedYear}</option>
                <option key={`quarter-2`} value={2}>2 - {selectedYear}</option>
                <option key={`quarter-3`} value={3}>3 - {selectedYear}</option>
                <option key={`quarter-4`} value={4}>4 - {selectedYear}</option>
              </Select>
            )}
            {selectedQuarter && (
              <Select
                placeholder='Select Quarter'
                value={selectQuarterFirstMonth || ""}
                onChange={(e) => setSelectQuarterFirstMonth(e.target.value)}
                size={"sm"}
                rounded={"lg"}
              >
                {selectedYear && allMonths.map((month, index) => (
                  <option key={`m-${month}`} value={index + 1}>{selectedYear}-{month}</option>
                ))}
              </Select>
            )}
            {selectedFilter && <Button width={100} size={"sm"} onClick={handleYearClear} className="self-end">Clear</Button>}
          </div>
        </div>
        <Divider />
        <CardBody m={0} p={0} className="flex flex-col gap-6">
          {/* <Flex color={"gray.500"} alignItems="center" justifyContent="space-between">
            <div className="flex gap-4 items-center text-lg">
              <HiArrowTrendingUp />
              Converted
            </div>
            {totalLeads === 0 ? 0 : convertedLeads}/{totalLeads}
          </Flex>
          <Progress
            value={totalLeads === 0 ? 0 : (convertedLeads / totalLeads) * 100}
            colorScheme="green"
            mt={2}
            height={2}
            rounded="lg"
          /> */}
          <div>
            <Flex color={"gray.500"} alignItems="center" justifyContent="space-between">
              <div className="flex gap-4 items-center text-lg">
                <TfiBarChart />
                In Progress
              </div>
              {totalLeads === 0 ? 0 : leadsInProgress}/{totalLeads}
            </Flex>
            <Progress
              value={totalLeads === 0 ? 0 : (leadsInProgress / totalLeads) * 100}
              colorScheme="blue"
              mt={2}
              height={2}
              rounded="lg"
            />
          </div>
          <div>
            <Flex color={"gray.500"} alignItems="center" justifyContent="space-between">
              <div className="flex gap-4 items-center text-lg">
                <IoAlertCircleOutline />
                Lost
              </div>
              {totalLeads === 0 ? 0 : lostLeads}/{totalLeads}
            </Flex>
            <Progress
              value={totalLeads === 0 ? 0 : (lostLeads / totalLeads) * 100}
              colorScheme="red"
              mt={2}
              height={2}
              rounded="lg"
            />
          </div>
          <div>
            <Flex color={"gray.500"} alignItems="center" justifyContent="space-between">
              <div className="flex gap-4 items-center text-lg">
                <SlDrawer />
                Raw
              </div>
              {totalLeads === 0 ? 0 : rawLeads}/{totalLeads}
            </Flex>
            <Progress
              value={totalLeads === 0 ? 0 : (rawLeads / totalLeads) * 100}
              colorScheme="yellow"
              mt={2}
              height={2}
              rounded="lg"
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
};

export default ConvertedLeads;
