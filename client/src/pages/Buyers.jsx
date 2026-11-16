import ResourcePage from "../components/ResourcePage";

const columns = [
  { key: "buyerCode", label: "Code" },
  { key: "companyName", label: "Company" },
  { key: "contactName", label: "Contact" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
];

const fields = [
  { name: "buyerCode", label: "Buyer Code *", required: true },
  { name: "companyName", label: "Company Name *", required: true },
  { name: "contactName", label: "Contact Name" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "address", label: "Address", type: "textarea" },
];

export default function Buyers() {
  return <ResourcePage title="Buyers" entity="Buyer" endpoint="/buyers" columns={columns} fields={fields} />;
}
