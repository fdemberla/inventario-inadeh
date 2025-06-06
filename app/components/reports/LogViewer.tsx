"use client";
import React, { useEffect, useState } from "react";
import { DataTable } from "../DataTable";

function LogViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`/api/inventory/transactions`);
      const data = await res.json();
      setLogs(data);
    };

    fetchLogs();
  }, []);

  const columns = [
    {
      header: "Notes",
      accessorKey: "Notes",
    },
    {
      header: "Producto",
      accessorKey: "ProductName",
    },
    {
      header: "Quantity Change",
      accessorKey: "QuantityChange",
    },
    {
      header: "Deposito",
      accessorKey: "WarehouseName",
    },
    {
      header: "Fecha",
      accessorKey: "FormattedDate",
    },
  ];

  return (
    <div>
      <DataTable data={logs} columns={columns} />
    </div>
  );
}

export default LogViewer;
