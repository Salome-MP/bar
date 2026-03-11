import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import ExcelJS from 'exceljs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const occurrenceId = searchParams.get('occurrence_id')

    const event = await prisma.event.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && event.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const where: any = { eventId: id }
    if (occurrenceId) {
      where.occurrenceId = occurrenceId
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        attendance: true,
        occurrence: true,
        orderItems: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Create workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AppBar'
    workbook.created = new Date()

    // --- Sheet 1: Asistentes ---
    const ws = workbook.addWorksheet('Asistentes')

    // Title row
    ws.mergeCells('A1:H1')
    const titleCell = ws.getCell('A1')
    titleCell.value = event.title
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF0F172A' } }
    titleCell.alignment = { vertical: 'middle' }
    ws.getRow(1).height = 30

    // Subtitle
    ws.mergeCells('A2:H2')
    const subtitleCell = ws.getCell('A2')
    subtitleCell.value = `${event.bar.name} — Exportado: ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    subtitleCell.font = { size: 10, color: { argb: 'FF6B7280' } }
    ws.getRow(2).height = 20

    // Summary row
    const totalReg = registrations.length
    const totalCheckedIn = registrations.filter(r => r.attendance).length
    ws.mergeCells('A3:H3')
    const summaryCell = ws.getCell('A3')
    summaryCell.value = `Total registrados: ${totalReg}  |  Ingresaron: ${totalCheckedIn}  |  Pendientes: ${totalReg - totalCheckedIn}`
    summaryCell.font = { size: 10, bold: true, color: { argb: 'FF374151' } }
    ws.getRow(3).height = 22

    // Empty row
    ws.getRow(4).height = 8

    // Header row
    const headerRow = ws.getRow(5)
    const headers = ['#', 'Nombre', 'Email', 'Telefono', 'Fecha Evento', 'Check-in', 'Hora Check-in', 'Fecha Registro']
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
      cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left' }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })
    headerRow.height = 28

    // Column widths
    ws.getColumn(1).width = 5    // #
    ws.getColumn(2).width = 25   // Nombre
    ws.getColumn(3).width = 30   // Email
    ws.getColumn(4).width = 18   // Telefono
    ws.getColumn(5).width = 18   // Fecha Evento
    ws.getColumn(6).width = 12   // Check-in
    ws.getColumn(7).width = 20   // Hora Check-in
    ws.getColumn(8).width = 20   // Fecha Registro

    // Data rows
    registrations.forEach((r, idx) => {
      const formData = r.formData as Record<string, string> | null
      const row = ws.getRow(6 + idx)
      const isEven = idx % 2 === 0

      const values = [
        idx + 1,
        formData?._attendee_name || '-',
        formData?._attendee_email || '-',
        formData?._attendee_phone || '-',
        r.occurrence?.date
          ? r.occurrence.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
          : '-',
        r.attendance ? 'Si' : 'No',
        r.attendance?.checkedInAt
          ? r.attendance.checkedInAt.toLocaleString('es-AR')
          : '-',
        r.createdAt.toLocaleString('es-AR'),
      ]

      values.forEach((v, i) => {
        const cell = row.getCell(i + 1)
        cell.value = v
        cell.font = { size: 10, color: { argb: 'FF374151' } }
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left' }

        // Zebra striping
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }

        // Check-in column color
        if (i === 5) {
          cell.font = {
            size: 10,
            bold: true,
            color: { argb: r.attendance ? 'FF15803D' : 'FFB45309' },
          }
        }

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF3F4F6' } },
        }
      })

      row.height = 24
    })

    // --- Sheet 2: Pedidos (if any orders exist) ---
    const regsWithOrders = registrations.filter(r => r.orderItems.length > 0)
    if (regsWithOrders.length > 0) {
      const wsOrders = workbook.addWorksheet('Pedidos')

      // Title
      wsOrders.mergeCells('A1:G1')
      const oTitle = wsOrders.getCell('A1')
      oTitle.value = `Pedidos — ${event.title}`
      oTitle.font = { size: 16, bold: true, color: { argb: 'FF0F172A' } }
      wsOrders.getRow(1).height = 30

      wsOrders.getRow(2).height = 8

      // Headers
      const oHeaderRow = wsOrders.getRow(3)
      const oHeaders = ['#', 'Asistente', 'Producto', 'Cantidad', 'Precio Unit.', 'Subtotal', 'Notas']
      oHeaders.forEach((h, i) => {
        const cell = oHeaderRow.getCell(i + 1)
        cell.value = h
        cell.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
        cell.alignment = { vertical: 'middle', horizontal: i >= 3 && i <= 5 ? 'right' : 'left' }
      })
      oHeaderRow.height = 28

      wsOrders.getColumn(1).width = 5
      wsOrders.getColumn(2).width = 25
      wsOrders.getColumn(3).width = 25
      wsOrders.getColumn(4).width = 12
      wsOrders.getColumn(5).width = 14
      wsOrders.getColumn(6).width = 14
      wsOrders.getColumn(7).width = 25

      let rowIdx = 4
      let grandTotal = 0
      regsWithOrders.forEach((r, regIdx) => {
        const formData = r.formData as Record<string, string> | null
        const name = formData?._attendee_name || '-'

        r.orderItems.forEach((oi, oiIdx) => {
          const row = wsOrders.getRow(rowIdx)
          const subtotal = oi.unitPrice * oi.quantity
          grandTotal += subtotal
          const isEven = (regIdx % 2 === 0)

          const values = [
            oiIdx === 0 ? regIdx + 1 : '',
            oiIdx === 0 ? name : '',
            oi.menuItem.name,
            oi.quantity,
            oi.unitPrice,
            subtotal,
            oi.notes || '',
          ]

          values.forEach((v, i) => {
            const cell = row.getCell(i + 1)
            cell.value = v
            cell.font = { size: 10, color: { argb: 'FF374151' } }
            cell.alignment = { vertical: 'middle', horizontal: i >= 3 && i <= 5 ? 'right' : 'left' }
            if (isEven) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
            }
            // Format currency
            if (i === 4 || i === 5) {
              cell.numFmt = '$#,##0.00'
            }
            cell.border = {
              bottom: { style: 'thin', color: { argb: 'FFF3F4F6' } },
            }
          })

          row.height = 22
          rowIdx++
        })
      })

      // Total row
      const totalRow = wsOrders.getRow(rowIdx + 1)
      wsOrders.mergeCells(`A${rowIdx + 1}:E${rowIdx + 1}`)
      const totalLabel = totalRow.getCell(1)
      totalLabel.value = 'TOTAL PEDIDOS'
      totalLabel.font = { size: 11, bold: true, color: { argb: 'FF0F172A' } }
      totalLabel.alignment = { horizontal: 'right', vertical: 'middle' }

      const totalValue = totalRow.getCell(6)
      totalValue.value = grandTotal
      totalValue.numFmt = '$#,##0.00'
      totalValue.font = { size: 11, bold: true, color: { argb: 'FF0F172A' } }
      totalValue.alignment = { horizontal: 'right', vertical: 'middle' }
      totalRow.height = 28
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `asistentes-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
