import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0891b2', // cyan-600
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#64748b', // slate-500
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155', // slate-700
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748b', // slate-500
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: '#1e293b', // slate-800
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1', // slate-300
    paddingBottom: 8,
    marginBottom: 10,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569', // slate-600
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  tableCell: {
    fontSize: 10,
    color: '#334155', // slate-700
  },
  descriptionCell: {
    flex: 3,
  },
  amountCell: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#cbd5e1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748b',
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    width: 100,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 20,
  },
  grandTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0891b2', // cyan-600
    width: 100,
    textAlign: 'right',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8fafc', // slate-50
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#475569',
  },
  notesText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8', // slate-400
  },
  statusBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    padding: '6 12',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#dcfce7', // green-100
    color: '#166534', // green-800
  },
  statusSent: {
    backgroundColor: '#dbeafe', // blue-100
    color: '#1e40af', // blue-800
  },
  statusOverdue: {
    backgroundColor: '#fee2e2', // red-100
    color: '#991b1b', // red-800
  },
  statusDraft: {
    backgroundColor: '#f1f5f9', // slate-100
    color: '#475569', // slate-600
  },
});

interface InvoiceTemplateProps {
  invoice: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    status: string;
    items: Array<{
      description: string;
      amount: number;
    }>;
    notes?: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    gstin?: string;
  };
  organization: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
  };
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return styles.statusPaid;
      case 'SENT':
        return styles.statusSent;
      case 'OVERDUE':
        return styles.statusOverdue;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
          <Text>{invoice.status}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{organization.name}</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        </View>

        {/* Organization and Client Information */}
        <View style={styles.row}>
          {/* From Section */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>From:</Text>
              <Text style={styles.value}>{organization.name}</Text>
              {organization.address && (
                <Text style={styles.value}>{organization.address}</Text>
              )}
              {organization.email && (
                <Text style={styles.value}>{organization.email}</Text>
              )}
              {organization.phone && (
                <Text style={styles.value}>{organization.phone}</Text>
              )}
            </View>
          </View>

          {/* Bill To Section */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.value}>{client.name}</Text>
              <Text style={styles.value}>{client.email}</Text>
              {client.phone && <Text style={styles.value}>{client.phone}</Text>}
              {client.address && (
                <Text style={styles.value}>{client.address}</Text>
              )}
              {client.gstin && (
                <Text style={styles.value}>GSTIN: {client.gstin}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Invoice Dates */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Issue Date</Text>
            <Text style={styles.value}>{invoice.issueDate}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{invoice.dueDate}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.descriptionCell}>
              <Text style={styles.tableHeaderCell}>Description</Text>
            </View>
            <View style={styles.amountCell}>
              <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>
                Amount
              </Text>
            </View>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.descriptionCell}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <View style={styles.amountCell}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount:</Text>
            <Text style={styles.grandTotalAmount}>
              {formatCurrency(invoice.amount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};
