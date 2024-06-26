import { useState, useEffect, useRef } from "react";
import {
  Stack,
  Input,
  Button,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  Select,
  Text,
  useToast,
} from "@chakra-ui/react";
import "react-datepicker/dist/react-datepicker.css";
import MyDatePicker from "../common/MyDatePicker";
import { PiArrowsLeftRightFill } from "react-icons/pi";
import { FaPlus, FaTrashCan } from "react-icons/fa6";
// import SelectProduct from "../common/SelectProduct";
// import SelectClient from "../common/SelectClient";
import { useNavigate } from "react-router-dom";
const RequiredIndicator = () => {
  return <Text as="span" color="red.500" ml={1}>*</Text>;
};
const Invoice = () => {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedGst, setSelectedGst] = useState(18);
  const [services, setServices] = useState([]);
  const [methodGSTorCash, setMethodGSTorCash] = useState('gst');
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const addServiceRef = useRef(null);

  useEffect(() => {
    if (addServiceRef.current && services.length > 1) addServiceRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [services])

  const fetchClients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/getAllClients`
      );
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/getAllProducts`
      );
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleClientChange = (event) => {
    const _id = event.target.value;
    const selectedClient = clients.find((client) => client._id === _id);
    setSelectedClient(selectedClient);
  };

  // const handleProductSelect = (event) => {
  //   const productId = event.target.value;
  //   const selectedProduct = products.find(
  //     (product) => product._id === productId
  //   );
  //   setSelectedProducts([...selectedProducts, selectedProduct]);
  // };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    if (field === "productId") {
      const selectedProduct = products.find((product) => product._id === value);

      updatedServices[index]["product"] = selectedProduct;
    } else {
      updatedServices[index][field] = value;
    }
    setServices(updatedServices);
  };

  useEffect(() => {
    setTotal(services?.reduce((a, v) => a = a + parseInt(v.unitPrice), 0));
  }, [services])

  const handleAddService = () => {
    setServices([
      ...services,
      {
        product: "",
        serviceDescription: "",
        mini_description: "",
        duration: "",
        quantity: 1,
        unitPrice: 0,
        startDate: "",
        endDate: "",
        date: "",
      },
    ]);
  };

  const handleRemoveService = (index) => {
    const updatedServices = [...services];
    updatedServices.splice(index, 1);
    setServices(updatedServices);
  };

  const handleSubmit = async () => {
    const requestData = {
      client_id: selectedClient.client_id,
      discount: discount,
      billType: methodGSTorCash,
      services: services.map((service) => ({
        product: service.product.product,
        serviceDescription: service.serviceDescription,
        duration: service.duration,
        quantity: parseInt(service.quantity),
        unitPrice: parseInt(service.unitPrice),
        startDate: service.startDate.toISOString(),
        endDate: service.endDate.toISOString(),
      })),
      date: selectedDate,
      gst: selectedGst || 18,
    };
    const requiredFields = [
      { key: 'client_id', label: 'Client' },
      { key: 'billType', label: 'billType' },
      { key: 'date', label: 'date' },
      { key: 'billType', label: 'billType' },
      { key: 'services', label: 'Services', isArray: true },
    ];
    const validateForm = (requestData, requiredFields) => {
      for (let { key, label, isArray } of requiredFields) {
        if (isArray ? !requestData[key] || requestData[key].length === 0 : !requestData[key]) {
          return `${label} is required.`;
        }
      }
      return null; // Return null if all required fields are present
    };

    const errorMessage = validateForm(requestData, requiredFields);
    if (errorMessage) {
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return; // Stop further execution if validation fails
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/createInvoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      console.log(response)

      if (!response.ok) {
        throw new Error("Failed to download Invoice slip");
      }

      const pdfBlob = await response.blob();
      const fileURL = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "invoice_slip.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setServices([]);
      setSelectedGst("");
      setProducts([]);
      toast({
        title: "Success",
        description: "Invoice slip downloaded successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/getAllInvoice");
      }, 2000);

    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice slip",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  const formatDate = (date) => {
    if (!date) return ""; // Handle the case where date is null or undefined
    const formattedDate = new Date(date);
    const day = formattedDate.getDate();
    const month = formattedDate.toLocaleString("default", { month: "short" });
    const year = formattedDate.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <Stack spacing={4}>
      <FormControl max-w-max >
        <FormLabel>Select Brand <RequiredIndicator /></FormLabel>
        <Select placeholder="Select Brand" onChange={handleClientChange}>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.brandName}
            </option>
          ))}
        </Select>
        {/* <SelectClient selectSourceValue={} setSelectSourceValue={} /> */}
      </FormControl>
      {selectedClient && (
        <Card variant={"outline"}>
          <CardBody>
            <Text textTransform={"capitalize"}>
              Client Name: {selectedClient.clientName}
            </Text>
            <Text textTransform={"capitalize"}>Client Company: {selectedClient.companyName}</Text>
            <Text textTransform={"capitalize"}>Business Address: {selectedClient.businessAddress}</Text>
          </CardBody>
        </Card>
      )}
      <FormControl>
        <FormLabel>
          Date
        </FormLabel>
        <div>
          <MyDatePicker
            className="h-[40px]"
            selected={selectedDate}
            onChange={(date) =>
              setSelectedDate(date)
            }
            format={"DD/MM/YYYY"}
          />
          <div>{formatDate(selectedDate)}</div>
        </div>
      </FormControl>

      {services.length > 0 && (
        <div className="flex items-center w-full pb-10 hide-scroll-bar">
          <div className="flex flex-col gap-3 flex-nowrap w-full">
            {services.map((service, index) => (
              <div key={`card-${index}`} className="w-[calc(100%-40px)] mx-4 p-4 shadow-lg rounded-xl">
                <div
                  onClick={() => handleRemoveService(index)}
                  className="flex items-center justify-center w-10 h-10 hover:bg-red-600 transition-all bg-red-500 text-white gap-2 rounded-full mb-4 cursor-pointer"
                >
                  <FaTrashCan />
                </div>

                <div className="flex gap-4 items-center mt-4">
                  <FormControl maxWidth={200} >
                    <FormLabel>Select Product <RequiredIndicator /></FormLabel>
                    <Select
                      placeholder="Select product"
                      onChange={(e) =>
                        handleServiceChange(index, "productId", e.target.value)
                      }
                      value={service.productId}
                    >
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.product}
                        </option>
                      ))}
                    </Select>
                    {/* <SelectProduct width={"100%"} selectSourceValue={productValue} setSelectSourceValue={setProductValue} /> */}
                  </FormControl>
                  <FormControl>
                    <FormLabel>Service Description</FormLabel>
                    <Input
                      value={service.serviceDescription}
                      onChange={(e) =>
                        handleServiceChange(
                          index,
                          "serviceDescription",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </div>

                <div className="flex gap-4 items-center mt-4">
                  <FormControl>
                    <FormLabel>Mini Description</FormLabel>
                    <Input
                      type="text"
                      value={service.mini_description}
                      onChange={(e) =>
                        handleServiceChange(index, "mini_description", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Duration</FormLabel>
                    <Input
                      type="text"
                      value={service.duration}
                      onChange={(e) =>
                        handleServiceChange(index, "duration", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Quantity<RequiredIndicator /></FormLabel>
                    <Input
                      type="number"
                      value={service?.quantity}
                      onChange={(e) =>
                        handleServiceChange(index, "quantity", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Unit Price<RequiredIndicator /></FormLabel>
                    <Input
                      value={service?.unitPrice}
                      onChange={(e) => handleServiceChange(index, "unitPrice", e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Sub Total<RequiredIndicator /></FormLabel>
                    <Input
                      value={
                        (service?.unitPrice * service?.quantity
                          + (selectedGst * service?.unitPrice / 100))
                      }
                      disabled
                    />
                  </FormControl>
                </div>

                <div className="flex gap-4 items-center my-4">
                  <FormControl maxWidth={100}>
                    <FormLabel>Start Date<RequiredIndicator /></FormLabel>
                    <MyDatePicker
                      className="h-[40px]"
                      selected={service.startDate}
                      onChange={(date) =>
                        handleServiceChange(index, "startDate", date)
                      } // Corrected to use 'date' instead of 'startDate'
                      disabledDate={(current) => {
                        return service.endDate && current > service.endDate;
                      }}
                    />
                    <div>{formatDate(service.startDate)}</div>
                  </FormControl>
                  <PiArrowsLeftRightFill size={20} />
                  <FormControl maxWidth={100}>
                    <FormLabel>End Date<RequiredIndicator /></FormLabel>
                    <MyDatePicker
                      className="h-[40px]"
                      selected={service.endDate}
                      onChange={(date) =>
                        handleServiceChange(index, "endDate", date)
                      } // Corrected to use 'date' instead of 'endDate'
                      disabledDate={(current) => {
                        return service.startDate && current < service.startDate;
                      }}
                    />
                    <div>{formatDate(service.endDate)}</div>
                  </FormControl>
                </div>
              </div>
            ))}
            <div
              onClick={handleAddService}
              ref={addServiceRef}
              className="border-[1px] w-[calc(100%-40px)] h-[150px] mx-4 p-4 shadow-lg my-4 transition-all hover:shadow-lg bg-purple-200 hover:bg-purple-300 rounded-lg border-gray-100 text-purple-900 flex flex-col gap-4 items-center justify-center cursor-pointer"
            >
              <FaPlus size={40} />
              Add Service
            </div>
          </div>
        </div>
      )}
      <FormControl>
        <FormLabel >
          Bill Type
          <RequiredIndicator />
        </FormLabel>
        <div className="flex gap-3" >
          <Select
            maxWidth={100}
            onChange={(e) => setMethodGSTorCash(e.target.value)}
            value={methodGSTorCash}
          >
            <option value={'cash'}>
              Cash
            </option>
            <option value={'gst'}>
              GST
            </option>
          </Select>
          {methodGSTorCash === 'gst' && (<>
            {/* <FormLabel>GST </FormLabel> */}
            <Input
              type="number"
              placeholder="Enter GST"
              value={selectedGst}
              onChange={(e) => setSelectedGst(e.target.value)}
              maxWidth={100}
            />
          </>)}
        </div>
      </FormControl>
      <div className="flex justify-between w-full">
        <FormControl>
          <FormLabel>Discount<RequiredIndicator /></FormLabel>
          <Input
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            maxWidth={100}
          />
        </FormControl>
        <FormControl maxWidth={200}>
          <FormLabel>Total<RequiredIndicator /></FormLabel>
          <Input
            value={total + (total * selectedGst / 100) - discount}
            // onChange={(e) => setTotal(e.target.value)}
            maxWidth={200}
          />
        </FormControl>
      </div>

      {services.length === 0 && selectedClient && (
        <Button
          onClick={handleAddService}
          variant={"outline"}
          colorScheme="purple"
        >
          Add Service
        </Button>
      )}
      <Button onClick={handleSubmit} colorScheme="purple">
        Create Invoice
      </Button>
    </Stack>
  );
};

export default Invoice;
