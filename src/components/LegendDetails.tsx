export default function LegendDetails() {
  return (
    <details className="legend-details">
      <summary>Chú giải: cách đọc Mã MH và Hệ đào tạo</summary>
      <div className="legend-body">
        <p style={{ marginTop: 0 }}>
          Với hầu hết các hệ, mã môn học tại HANU có cấu trúc:
          <br />
          <code>&lt;2 mã số&gt;</code> <code>&lt;tên khoa viết tắt&gt;</code> <code>&lt;năm học&gt;</code> <code>&lt;tên môn học viết tắt&gt;</code>
        </p>
        <p style={{ marginTop: 0 }}>
          Ví dụ <code>61FIT2CAL</code> gồm <code>61</code> (mã hệ), <code>FIT</code> (khoa Công nghệ thông tin),
          <code>2</code> (năm học) và <code>CAL</code> (viết tắt của Calculus, tức Toán cao cấp).
          <br />
          Cùng một môn ở hệ khác thường chỉ đổi 2 số đầu, ví dụ <code>66FIT2CAL</code>.
        </p>
        <p>
          Riêng một số chương trình như La Trobe hoặc các mã dạng LIB, ITEC... không bắt đầu bằng 2 chữ số,
          nên không gọi là "mã hệ" mà chỉ xếp chung vào ô lọc "Hệ đào tạo" theo tên hoặc tiền tố riêng của chương trình đó.
        </p>
        <p>Các giá trị có thể chọn ở ô "Hệ đào tạo" và ý nghĩa tương ứng:</p>
        <table className="legend-table">
          <thead>
            <tr><th>Hệ đào tạo</th><th>Ý nghĩa</th></tr>
          </thead>
          <tbody>
            <tr><td><code>61</code></td><td>Tiêu chuẩn (chính quy)</td></tr>
            <tr><td><code>62</code></td><td>Chất lượng cao (CLC)</td></tr>
            <tr><td><code>63</code></td><td>Văn bằng 2</td></tr>
            <tr><td><code>64</code></td><td>Vừa làm vừa học (trước đây gọi là Tại chức)</td></tr>
            <tr><td><code>65</code></td><td>Đào tạo từ xa</td></tr>
            <tr><td><code>66</code></td><td>Tiên tiến</td></tr>
            <tr><td><code>La Trobe</code></td><td>Chương trình liên kết La Trobe</td></tr>
            <tr><td><code>LIB, ITEC,...</code></td><td>Mã không bắt đầu bằng 2 chữ số và chưa xác định rõ hệ (vd thư viện, môn chung,...)</td></tr>
          </tbody>
        </table>
        <p style={{ marginBottom: 0 }}>
          Lưu ý: cách đọc này được suy ra dựa trên các nguồn tham khảo công khai của trường, có thể
          chưa chính xác 100% với mọi trường hợp.
        </p>
      </div>
    </details>
  );
}
