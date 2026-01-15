import { Modal, Button, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

export type InventoryItem = {
  InventoryID: number;
  ProductID: number;
  ProductName: string;
  QuantityOnHand: number;
};

type Props = {
  item: InventoryItem | null;
  warehouseId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function InventoryUpdateModal({
  item,
  warehouseId,
  onClose,
  onSuccess,
}: Props) {
  const [modalQty, setModalQty] = useState<string>("");

  useEffect(() => {
    if (item) {
      setModalQty(item.QuantityOnHand.toString());
    }
  }, [item]);

  const handleUpdate = async () => {
    if (!item || !warehouseId) return;

    const newQty = Number(modalQty);

    if (modalQty === "" || isNaN(newQty) || newQty === item.QuantityOnHand) {
      toast("Sin cambios válidos para este producto.");
      return;
    }

    try {
      const res = await fetch(withBasePath("/api/inventory/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.ProductID,
          warehouseId,
          newQuantity: newQty,
          notes: "Ajuste manual",
          referenceNumber: `WEB-${new Date().toISOString().slice(0, 10)}`,
          updateType: "table",
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Producto ${item.ProductName} actualizado.`);
        onClose();
        onSuccess?.();
      } else {
        toast.error(result.message || "Error al actualizar.");
      }
    } catch (err) {
      toast.error("Error de red al actualizar.");
      console.error(err);
    }
  };

  return (
    <Modal show={!!item} size="md" onClose={onClose} popup>
      <div className="space-y-4 p-6">
        <h3 className="text-xl font-medium text-gray-900 dark:text-white">
          Actualizar cantidad
        </h3>
        {item && (
          <>
            <p className="dark:text-white">
              <strong>Producto:</strong> {item.ProductName}
            </p>
            <p className="dark:text-white">
              <strong>Unidad:</strong> {item.UnitName}
            </p>
            <p className="dark:text-white">
              <strong>Cantidad actual:</strong> {item.QuantityOnHand}
            </p>
            <TextInput
              type="number"
              value={modalQty}
              onChange={(e) => setModalQty(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleUpdate}>Guardar</Button>
              <Button color="red" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
