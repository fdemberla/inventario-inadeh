import { Modal, ModalFooter, Button, FormField } from "@/app/components/ui";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { withBasePath } from "@/lib/utils";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setModalQty(item.QuantityOnHand.toString());
    }
  }, [item]);

  const handleUpdate = async () => {
    if (!item || !warehouseId) return;

    const newQty = Number(modalQty);

    if (modalQty === "" || !Number.isInteger(newQty) || newQty < 0) {
      toast.error("La cantidad debe ser un número entero mayor o igual a 0.");
      return;
    }

    if (newQty === item.QuantityOnHand) {
      toast("Sin cambios para este producto.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Actualizando cantidad...");

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
        toast.success(`Producto ${item.ProductName} actualizado.`, { id: toastId });
        onClose();
        onSuccess?.();
      } else {
        toast.error(result.message || "Error al actualizar.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error de red al actualizar.", { id: toastId });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={!!item} 
      onClose={onClose} 
      title="Actualizar cantidad"
      size="md"
      footer={
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={isSubmitting} disabled={isSubmitting}>
            Guardar
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-5 pt-2 pb-2">
        {item && (
          <>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">Producto:</span> {item.ProductName}
              </p>
              {item.UnitName && (
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">Unidad:</span> {item.UnitName}
                </p>
              )}
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">Cantidad actual:</span> {item.QuantityOnHand}
              </p>
            </div>
            <FormField
              label="Nueva cantidad"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={modalQty}
              onChange={(e) => setModalQty(e.target.value)}
              disabled={isSubmitting}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
