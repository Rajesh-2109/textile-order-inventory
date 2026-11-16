import ResourcePage from "../components/ResourcePage";
import { fileUrl } from "../api/axios";

const columns = [
  {
    key: "image",
    label: "Image",
    render: (r) => (r.image ? <img className="thumb" src={fileUrl(r.image)} alt={r.name} /> : "-"),
  },
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "colour", label: "Colour" },
  { key: "unit", label: "Unit" },
  { key: "reorderLevel", label: "Reorder Lvl" },
];

const fields = [
  { name: "sku", label: "SKU / Style Code *", required: true },
  { name: "name", label: "Product Name *", required: true },
  { name: "category", label: "Category" },
  { name: "material", label: "Material" },
  { name: "size", label: "Size" },
  { name: "colour", label: "Colour" },
  { name: "unit", label: "Unit", type: "select", options: ["pcs", "sets", "kg", "m", "cartons"], default: "pcs" },
  { name: "reorderLevel", label: "Reorder Level", type: "number", default: 0 },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image", label: "Product Image", type: "file" },
];

function Products() {
  return <ResourcePage title="Products" entity="Product" endpoint="/products" columns={columns} fields={fields} />;
}

export default Products;
