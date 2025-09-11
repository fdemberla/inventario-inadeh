import { Modal, Button, TextInput } from "flowbite-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export type InventoryItem = {
  InventoryID: number;
  ProductID: number;
  ProductName: string;
  QuantityOnHand: number;
  UnitName?: string;
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
  const { data: session } = useSession();

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

    // Get user info for createdBy field
    const createdBy =
      session?.user?.username ||
      session?.user?.email ||
      session?.user?.name ||
      "WEB_USER";

    // Create detailed notes with user information
    const detailedNotes = `Ajuste manual realizado por ${session?.user?.firstName || session?.user?.name || createdBy}. Cantidad anterior: ${item.QuantityOnHand}, nueva cantidad: ${newQty}`;

    try {
      const res = await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.ProductID,
          warehouseId,
          newQuantity: newQty,
          notes: detailedNotes,
          referenceNumber: `WEB-${new Date().toISOString().slice(0, 10)}`,
          updateType: "table",
          createdBy: createdBy,
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
