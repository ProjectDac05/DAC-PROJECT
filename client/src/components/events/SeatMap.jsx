export default function SeatMap({
  seats = [],
  selectedSeats = [],
  onSeatSelect,
}) {
  // Validate props
  if (!Array.isArray(seats)) {
    console.error("Seats prop must be an array");
    return null;
  }

  if (!Array.isArray(selectedSeats)) {
    console.error("selectedSeats prop must be an array");
    return null;
  }

  if (typeof onSeatSelect !== "function") {
    console.error("onSeatSelect prop must be a function");
    return null;
  }

  // Group seats by row for better visualization
  const groupSeatsByRow = () => {
    const rows = {};
    seats.forEach((seat) => {
      if (!seat?.seat_number) {
        console.error("Invalid seat data:", seat);
        return;
      }

      try {
        // Extract row letter from seat number (e.g., "A" from "A-01")
        const seatNumber = String(seat.seat_number);
        const rowMatch = seatNumber.match(/^([A-Z]+)/);
        if (!rowMatch) {
          console.error("Invalid seat number format:", seatNumber);
          return;
        }

        const row = rowMatch[1];
        if (!rows[row]) {
          rows[row] = [];
        }

        // Ensure all seat properties are primitive values
        const processedSeat = {
          ...seat,
          seat_id: Number(seat.seat_id),
          event_id: Number(seat.event_id),
          seat_number: String(seat.seat_number),
          seat_type: String(seat.seat_type || "regular"),
          price_multiplier: Number(seat.price_multiplier || 1),
          is_booked: Boolean(seat.is_booked),
          final_price: Number(seat.final_price || 0),
        };

        rows[row].push(processedSeat);
      } catch (error) {
        console.error("Error processing seat:", seat, error);
      }
    });

    // Sort seats within each row
    Object.keys(rows).forEach((row) => {
      rows[row].sort((a, b) => {
        try {
          const aNum = parseInt(
            String(a.seat_number).match(/\d+$/)?.[0] || "0"
          );
          const bNum = parseInt(
            String(b.seat_number).match(/\d+$/)?.[0] || "0"
          );
          return aNum - bNum;
        } catch (error) {
          console.error("Error sorting seats:", a, b, error);
          return 0;
        }
      });
    });

    return rows;
  };

  const seatRows = groupSeatsByRow();

  return (
    <div className="space-y-6">
      {/* Stage indicator */}
      <div className="text-center py-4 bg-gray-100 rounded-lg">
        <div className="text-lg font-medium text-gray-700">STAGE</div>
      </div>

      {/* Seat rows */}
      {Object.entries(seatRows).map(([row, rowSeats]) => (
        <div key={row} className="flex justify-center items-center space-x-2">
          <div className="w-8 text-center font-medium">{row}</div>
          <div className="flex flex-wrap gap-2">
            {rowSeats.map((seat) => {
              try {
                const isSelected = selectedSeats.includes(Number(seat.seat_id));
                const isBooked = Boolean(seat.is_booked);
                const seatNumber =
                  String(seat.seat_number).match(/\d+$/)?.[0] || "";
                const finalPrice = Number(seat.final_price).toFixed(2);

                let seatClass =
                  "w-10 h-10 rounded flex items-center justify-center text-sm font-medium ";

                if (isBooked) {
                  seatClass += "bg-gray-300 text-gray-500 cursor-not-allowed";
                } else if (isSelected) {
                  seatClass += "bg-indigo-600 text-white cursor-pointer";
                } else {
                  seatClass +=
                    "bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer";
                }

                return (
                  <div
                    key={`${row}-${seat.seat_id}`}
                    className={seatClass}
                    onClick={() =>
                      !isBooked && onSeatSelect(Number(seat.seat_id))
                    }
                    title={`${seat.seat_number} - ₹${finalPrice}`}
                  >
                    {seatNumber}
                  </div>
                );
              } catch (error) {
                console.error("Error rendering seat:", seat, error);
                return null;
              }
            })}
          </div>
        </div>
      ))}

      {/* Seat legend */}
      <div className="flex justify-center space-x-6 mt-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-indigo-600 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Booked</span>
        </div>
      </div>
    </div>
  );
}
