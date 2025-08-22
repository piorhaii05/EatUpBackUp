/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam Đồng (VND).
 * Ví dụ: 150000 -> "150.000 ₫"
 * @param {number} price - Giá trị số cần định dạng.
 * @returns {string} Chuỗi tiền tệ đã được định dạng.
 */
export const formatPriceVND = (price) => {
    if (typeof price !== 'number') {
        return "N/A";
    }
    return price.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND'
    });
};

/**
 * Định dạng một số thành chuỗi số có dấu phân cách hàng nghìn.
 * Ví dụ: 150000 -> "150.000"
 * @param {number} number - Số cần định dạng.
 * @returns {string} Chuỗi số đã được định dạng.
 */
export const formatNumber = (number) => {
    if (typeof number !== 'number') {
        return "N/A";
    }
    return number.toLocaleString('vi-VN');
};


export default function CurrencyScreen() {
  return null;
}